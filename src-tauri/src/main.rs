#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use sysinfo::System;
use serde::Serialize;
use std::net::TcpStream;
use std::time::Duration;

#[derive(Serialize)]
struct SystemSpecs {
    total_memory: u64,
    free_memory: u64,
    cpu_cores: usize,
    cpu_brand: String,
    os_name: String,
}

#[derive(Serialize)]
struct ProxyResponse {
    status: u16,
    text: String,
}

#[tauri::command]
fn get_system_specs() -> SystemSpecs {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpus = sys.cpus();
    let cpu_brand = if !cpus.is_empty() {
        cpus[0].brand().to_string()
    } else {
        "Unknown CPU".to_string()
    };

    SystemSpecs {
        total_memory: sys.total_memory() / 1024 / 1024, // In MB
        free_memory: sys.free_memory() / 1024 / 1024, // In MB
        cpu_cores: sys.cpus().len(),
        cpu_brand,
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
    }
}

#[tauri::command]
fn check_ollama_status() -> bool {
    // Ping port 11434 to see if Ollama is running
    match TcpStream::connect_timeout(
        &"127.0.0.1:11434".parse().unwrap(),
        Duration::from_millis(500),
    ) {
        Ok(_) => true,
        Err(_) => false,
    }
}

fn is_allowed_url(url: &str) -> bool {
    url.starts_with("http://localhost:11434") || url.starts_with("http://127.0.0.1:11434")
}

#[tauri::command]
async fn proxy_request(method: String, url: String, body: Option<String>) -> Result<ProxyResponse, String> {
    if !is_allowed_url(&url) {
        return Err("URL not allowed".to_string());
    }

    let client = reqwest::Client::new();
    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        _ => return Err("Unsupported method".to_string()),
    };
    if let Some(b) = body {
        req = req.body(b).header("Content-Type", "application/json");
    }
    match req.send().await {
        Ok(res) => {
            let status = res.status().as_u16();
            let text = res.text().await.map_err(|e| e.to_string())?;
            Ok(ProxyResponse { status, text })
        },
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn proxy_stream(window: tauri::Window, id: String, method: String, url: String, body: Option<String>) -> Result<(), String> {
    if !is_allowed_url(&url) {
        return Err("URL not allowed".to_string());
    }

    let client = reqwest::Client::new();
    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        _ => return Err("Unsupported method".to_string()),
    };
    if let Some(b) = body {
        req = req.body(b).header("Content-Type", "application/json");
    }

    let mut res = match req.send().await {
        Ok(res) => {
            if !res.status().is_success() {
                let err_msg = format!("HTTP Error {}", res.status());
                let _ = window.emit(&format!("stream_error_{}", id), err_msg);
                return Err("Stream returned error status".to_string());
            }
            res
        },
        Err(e) => {
            let _ = window.emit(&format!("stream_error_{}", id), e.to_string());
            return Err(e.to_string());
        }
    };

    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        let bytes: Vec<u8> = chunk.to_vec();
        let _ = window.emit(&format!("stream_{}", id), bytes);
    }

    let _ = window.emit(&format!("stream_done_{}", id), ());
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_specs,
            check_ollama_status,
            proxy_request,
            proxy_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
