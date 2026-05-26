mod commands;
mod metadata;
mod playlist;
mod scanner;
mod settings;
use tauri::{
    image::Image,
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
            let play_pause = MenuItemBuilder::with_id("play_pause", "Play").build(app)?;
            let next = MenuItemBuilder::with_id("next", "Next").build(app)?;
            let prev = MenuItemBuilder::with_id("prev", "Previous").build(app)?;
            let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;

            let menu = MenuBuilder::new(app)
                .item(&play_pause)
                .item(&next)
                .item(&prev)
                .separator()
                .item(&quit)
                .build()?;

            // Build tray icon
            let img = image::load_from_memory(include_bytes!("../icons/32x32.png"))
                .expect("failed to load tray icon PNG")
                .into_rgba8();
            let (width, height) = img.dimensions();
            let tray_icon = Image::new_owned(img.into_raw(), width, height);
            let tray = TrayIconBuilder::new()
                .icon(tray_icon)
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

            // Listen for play state changes to update tray menu label
            let play_pause_clone = play_pause.clone();
            app.listen("update-tray-play-state", move |event| {
                let playing = event.payload().trim_matches('"');
                let label = if playing == "true" { "Pause" } else { "Play" };
                let _ = play_pause_clone.set_text(label);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_dir,
            commands::get_audio_files,
            commands::get_metadata,
            commands::get_metadata_batch,
            commands::get_playlists,
            commands::sync_playlist,
            commands::remove_playlist,
            commands::open_in_explorer,
            commands::write_tags,
            commands::load_app_settings,
            commands::save_app_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
