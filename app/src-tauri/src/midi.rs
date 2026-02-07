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
struct MidiConnectionStatus {
    connected: bool,
    port_name: Option<String>,
}

/// Holds the active MIDI connection so it doesn't get dropped.
pub struct MidiState {
    connection: Mutex<Option<MidiInputConnection<()>>>,
}

impl MidiState {
    pub fn new() -> Self {
        Self {
            connection: Mutex::new(None),
        }
    }
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
            let _ = app.emit("midi:connection", MidiConnectionStatus {
                connected: true,
                port_name: Some(port_name),
            });
            // Store the connection so it stays alive
            let state = app.state::<MidiState>();
            *state.connection.lock().unwrap() = Some(conn);
        }
        Err(e) => {
            log::error!("Failed to connect to MIDI port: {}", e);
            let _ = app.emit("midi:connection", MidiConnectionStatus {
                connected: false,
                port_name: None,
            });
        }
    }
}

/// Periodically check for MIDI devices (handles hot-plug).
pub fn start_midi_watcher(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            // Check if we already have a connection
            {
                let state = app.state::<MidiState>();
                let conn = state.connection.lock().unwrap();
                if conn.is_some() {
                    // Already connected, check again later
                    drop(conn);
                    std::thread::sleep(std::time::Duration::from_secs(3));
                    continue;
                }
            }
            // Try to connect
            connect_midi(&app);
            std::thread::sleep(std::time::Duration::from_secs(2));
        }
    });
}
