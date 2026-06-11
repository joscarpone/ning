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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_specs,
            check_ollama_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
