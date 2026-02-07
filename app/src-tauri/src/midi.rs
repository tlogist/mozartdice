use midir::{MidiInput, MidiInputConnection};
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, Serialize)]
struct MidiNoteOn {
    note: u8,
    velocity: u8,
}

#[derive(Clone, Serialize)]
struct MidiNoteOff {
    note: u8,
}

#[derive(Clone, Serialize)]
pub struct MidiConnectionStatus {
    pub connected: bool,
    pub port_name: Option<String>,
}

/// Holds the active MIDI connection so it doesn't get dropped.
pub struct MidiState {
    connection: Mutex<Option<MidiInputConnection<()>>>,
    port_name: Mutex<Option<String>>,
}

impl MidiState {
    pub fn new() -> Self {
        Self {
            connection: Mutex::new(None),
            port_name: Mutex::new(None),
        }
    }

    fn current_status(&self) -> MidiConnectionStatus {
        let connected = self.connection.lock().map(|c| c.is_some()).unwrap_or(false);
        let port_name = self.port_name.lock().map(|p| p.clone()).unwrap_or(None);
        MidiConnectionStatus { connected, port_name }
    }

    fn set_disconnected(&self) {
        if let Ok(mut conn) = self.connection.lock() {
            *conn = None;
        }
        if let Ok(mut port) = self.port_name.lock() {
            *port = None;
        }
    }
}

#[tauri::command]
pub fn midi_status(state: tauri::State<'_, MidiState>) -> MidiConnectionStatus {
    state.current_status()
}

/// Scan for MIDI input ports and connect to the first one found.
/// Emits `midi:note-on`, `midi:note-off`, and `midi:connection` events.
pub fn connect_midi(app: &AppHandle) {
    let midi_in = match MidiInput::new("dice-and-discipline") {
        Ok(m) => m,
        Err(e) => {
            log::error!("Failed to create MIDI input: {}", e);
            return;
        }
    };

    let ports = midi_in.ports();
    if ports.is_empty() {
        log::info!("No MIDI input ports found");
        let _ = app.emit("midi:connection", MidiConnectionStatus {
            connected: false,
            port_name: None,
        });
        return;
    }

    let port = &ports[0];
    let port_name = midi_in.port_name(port).unwrap_or_else(|_| "Unknown".into());
    log::info!("Connecting to MIDI port: {}", port_name);

    let app_handle = app.clone();
    let connection = midi_in.connect(
        port,
        "midi-input",
        move |_timestamp, message, _| {
            if message.len() < 3 {
                return;
            }

            let status = message[0] & 0xf0;
            let note = message[1];
            let velocity = message[2];

            if status == 0x90 && velocity > 0 {
                let _ = app_handle.emit("midi:note-on", MidiNoteOn { note, velocity });
            } else if status == 0x80 || (status == 0x90 && velocity == 0) {
                let _ = app_handle.emit("midi:note-off", MidiNoteOff { note });
            }
        },
        (),
    );

    match connection {
        Ok(conn) => {
            let status = MidiConnectionStatus {
                connected: true,
                port_name: Some(port_name),
            };
            // Store the connection so it stays alive
            let state = app.state::<MidiState>();
            if let Ok(mut connection) = state.connection.lock() {
                *connection = Some(conn);
            }
            if let Ok(mut port) = state.port_name.lock() {
                *port = status.port_name.clone();
            }
            let _ = app.emit("midi:connection", status);
        }
        Err(e) => {
            log::error!("Failed to connect to MIDI port: {}", e);
            app.state::<MidiState>().set_disconnected();
            let _ = app.emit("midi:connection", MidiConnectionStatus {
                connected: false,
                port_name: None,
            });
        }
    }
}

fn is_connected_port_present(app: &AppHandle) -> bool {
    let connected_port = {
        let state = app.state::<MidiState>();
        let port_name = match state.port_name.lock() {
            Ok(port) => port.clone(),
            Err(_) => None,
        };
        port_name
    };

    let Some(connected_port) = connected_port else {
        return false;
    };

    let midi_in = match MidiInput::new("dice-and-discipline-check") {
        Ok(m) => m,
        Err(e) => {
            log::warn!("Unable to check MIDI ports: {}", e);
            return true;
        }
    };

    let ports = midi_in.ports();
    ports.iter().any(|port| midi_in.port_name(port).map(|n| n == connected_port).unwrap_or(false))
}

/// Periodically check for MIDI devices (handles hot-plug).
pub fn start_midi_watcher(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            // Check if we already have a connection
            {
                let state = app.state::<MidiState>();
                let has_connection = state.connection.lock().map(|c| c.is_some()).unwrap_or(false);
                if has_connection {
                    if is_connected_port_present(&app) {
                        std::thread::sleep(std::time::Duration::from_secs(3));
                        continue;
                    }
                    // Connected device disappeared; mark disconnected and reconnect.
                    state.set_disconnected();
                    let _ = app.emit("midi:connection", MidiConnectionStatus {
                        connected: false,
                        port_name: None,
                    });
                    std::thread::sleep(std::time::Duration::from_secs(3));
                }
            }
            // Try to connect
            connect_midi(&app);
            std::thread::sleep(std::time::Duration::from_secs(2));
        }
    });
}
