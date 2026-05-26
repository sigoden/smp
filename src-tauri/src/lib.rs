mod commands;
mod metadata;
mod playlist;
mod scanner;
mod settings;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Listener, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Build tray menu
            let play_pause = MenuItemBuilder::with_id("play_pause", "Play/Pause").build(app)?;
            let next = MenuItemBuilder::with_id("next", "Next").build(app)?;
            let prev = MenuItemBuilder::with_id("prev", "Previous").build(app)?;
            let stop = MenuItemBuilder::with_id("stop", "Stop").build(app)?;
            let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;

            let menu = MenuBuilder::new(app)
                .item(&play_pause)
                .item(&next)
                .item(&prev)
                .item(&stop)
                .separator()
                .item(&quit)
                .build()?;

            // Build tray icon
            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Music Player")
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "play_pause" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-action", "play-pause");
                            }
                        }
                        "next" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-action", "next");
                            }
                        }
                        "prev" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-action", "prev");
                            }
                        }
                        "stop" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-action", "stop");
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Listen for tray tooltip updates from frontend
            let tray_handle = tray.clone();
            app.listen("update-tray-tooltip", move |event| {
                let payload = event.payload().trim_matches('"').to_string();
                let _ = tray_handle.set_tooltip(Some(&payload));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_dir,
            commands::get_audio_files,
            commands::get_metadata,
            commands::get_metadata_batch,
            commands::get_playlists,
            commands::create_playlist,
            commands::update_playlist,
            commands::remove_playlist,
            commands::open_in_explorer,
            commands::write_tags,
            commands::load_app_settings,
            commands::save_app_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
