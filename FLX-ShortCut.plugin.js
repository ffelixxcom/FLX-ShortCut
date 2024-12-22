/**
 * @name FLX ShortCut
 * @author ffelixxcom
 * @authorId 224538553944637440
 * @version 1.0.0
 * @description Adds customizable shortcut buttons to the context menu
 * @invite M8DBtcZjXD
 * @website https://github.com/ffelixxcom
 * @source https://github.com/ffelixxcom/FLX-ShortCut
 * @updateUrl https://raw.githubusercontent.com/ffelixxcom/FLX-ShortCut/main/FLX-ShortCut.plugin.js
 */

/*@cc_on
@if (@_jscript)
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();
@else@*/

module.exports = (() => {
    const config = {
        info: {
            name: "FLX ShortCut",
            authors: [
                {
                    name: "ffelix_x",
                    discord_id: "1068856895894462474",
                    github_username: "ffelixxcom"
                }
            ],
            version: "1.0.0",
            description: "Adds customizable shortcut buttons to the context menu",
            github: "https://github.com/ffelixxcom",
            github_raw: "https://raw.githubusercontent.com/ffelixxcom/FLX-ShortCut/main/FLX-ShortCut.plugin.js"
        }
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() { }
        stop() { }
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
            const { Logger, WebpackModules, DiscordModules } = Library;
            const { ContextMenu } = window.BdApi;
            const { MessageActions } = DiscordModules;
            const SelectedChannelStore = WebpackModules.getByProps("getChannelId", "getLastSelectedChannelId");

            return class FLXShortCut extends Plugin {
                getName() { return config.info.name; }
                getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
                getDescription() { return config.info.description; }
                getVersion() { return config.info.version; }

                defaultSettings = {
                    shortcuts: {
                        shortcut1_name: "Merhaba",
                        shortcut1_text: "Merhaba, hoş geldiniz!",
                        shortcut2_name: "Görüşürüz",
                        shortcut2_text: "Görüşmek üzere, iyi günler!"
                    },
                    customShortcuts: []
                };

                constructor() {
                    super();
                    this._config = config;
                    this.settings = this.loadSettings();
                }

                loadSettings() {
                    const loadedSettings = BdApi.Data.load("FLX-ShortCut", "settings");
                    return loadedSettings ? loadedSettings : this.defaultSettings;
                }

                saveSettings() {
                    BdApi.Data.save("FLX-ShortCut", "settings", this.settings);
                }

                getSettingsPanel() {
                    const panel = document.createElement("div");
                    panel.className = "flx-settings";

                    // Stil ekle
                    panel.innerHTML = `
                        <style>
                            .flx-settings { padding: 16px; }
                            .flx-group { margin-bottom: 20px; }
                            .flx-group-title { color: var(--header-primary); margin-bottom: 8px; font-weight: bold; }
                            .flx-setting { margin-bottom: 16px; position: relative; }
                            .flx-setting label { display: block; margin-bottom: 4px; color: var(--header-secondary); }
                            .flx-setting input, .flx-setting textarea {
                                width: 100%;
                                padding: 8px;
                                background: var(--input-background);
                                border: 1px solid var(--input-border);
                                color: var(--text-normal);
                                border-radius: 3px;
                            }
                            .flx-setting textarea { min-height: 80px; resize: vertical; }
                            .flx-button, .flx-delete-button {
                                height: 32px;
                                padding: 0 16px;
                                min-width: 120px;
                                border: none;
                                border-radius: 4px;
                                color: #fff;
                                cursor: pointer;
                                font-size: 13px;
                                font-weight: 600;
                                font-family: var(--font-display);
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                transition: all 0.2s ease;
                                text-transform: uppercase;
                                letter-spacing: 0.6px;
                                box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
                            }
                            .flx-button.add { background: var(--button-positive-background); }
                            .flx-button.add:hover { background: var(--button-positive-background-hover); }
                            .flx-button.reset { background: var(--button-danger-background); }
                            .flx-button.reset:hover { background: var(--button-danger-background-hover); }
                            .flx-button.save { background: var(--brand-experiment); }
                            .flx-button.save:hover { background: var(--brand-experiment-560); }
                            .flx-button.load { background: var(--button-secondary-background); }
                            .flx-button.load:hover { background: var(--button-secondary-background-hover); }
                            .flx-delete-button {
                                position: absolute;
                                right: 0;
                                top: 0;
                                width: 32px;
                                min-width: unset;
                                padding: 0;
                            }
                            .flx-config-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--background-modifier-accent); }
                            .flx-button-group { display: flex; gap: 10px; margin-top: 15px; }
                            /* Geliştirici bilgisi için stil */
                            .flx-developer-info {
                                margin-top: 30px;
                                padding: 20px;
                                border-top: 2px solid var(--background-modifier-accent);
                                text-align: center;
                                color: #ddd;
                                font-size: 16px;
                                font-weight: 600;
                                letter-spacing: 1px;
                                font-family: var(--font-display);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 12px;
                                background: var(--background-tertiary);
                                border-radius: 8px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                                transition: all 0.3s ease;
                            }

                            .flx-developer-info:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 15px rgba(0,0,0,0.25);
                                background: var(--background-secondary-alt);
                            }

                            .flx-developer-info a {
                                color: #fff;
                                text-decoration: none;
                                font-size: 18px;
                                font-weight: 800;
                                transition: all 0.3s ease;
                                background: linear-gradient(90deg, #5865F2 0%, #7289DA 100%);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                padding: 0 4px;
                                text-shadow: none;
                                filter: drop-shadow(0 0 2px rgba(88, 101, 242, 0.5));
                            }

                            .flx-developer-info svg {
                                width: 24px;
                                height: 24px;
                                fill: #5865F2;
                                filter: drop-shadow(0 0 2px rgba(88, 101, 242, 0.5));
                                transition: all 0.3s ease;
                            }

                            .flx-developer-info:hover svg {
                                transform: rotate(360deg);
                                fill: #7289DA;
                            }

                            .flx-developer-info span {
                                color: #fff;
                                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                            }
                        </style>
                    `;

                    // Varsayılan kısayollar grubu
                    const defaultGroup = document.createElement("div");
                    defaultGroup.className = "flx-group";
                    defaultGroup.innerHTML = `<div class="flx-group-title">Default Shortcuts</div>`;

                    // Varsayılan kısayolları ekle
                    for (let i = 1; i <= 2; i++) {
                        const setting = document.createElement("div");
                        setting.className = "flx-setting";
                        setting.innerHTML = `
                            <div>
                                <label>Shortcut ${i} Name</label>
                                <input type="text" id="shortcut${i}_name" value="${this.settings.shortcuts[`shortcut${i}_name`]}">
                            </div>
                            <div style="margin-top: 8px;">
                                <label>Shortcut ${i} Text</label>
                                <textarea id="shortcut${i}_text">${this.settings.shortcuts[`shortcut${i}_text`]}</textarea>
                            </div>
                        `;
                        defaultGroup.appendChild(setting);
                    }

                    // Özel kısayollar grubu
                    const customGroup = document.createElement("div");
                    customGroup.className = "flx-group";
                    customGroup.innerHTML = `<div class="flx-group-title">Custom Shortcuts</div>`;

                    // Mevcut özel kısayolları ekle
                    this.settings.customShortcuts?.forEach((shortcut, index) => {
                        customGroup.appendChild(this.createCustomShortcutElement(shortcut, index, customGroup));
                    });

                    // Yeni kısayol ekleme butonu
                    const addButton = document.createElement("button");
                    addButton.className = "flx-button add";
                    addButton.textContent = "Add New Shortcut";
                    addButton.onclick = () => {
                        const newShortcut = { name: "", text: "" };
                        if (!this.settings.customShortcuts) this.settings.customShortcuts = [];
                        this.settings.customShortcuts.push(newShortcut);
                        customGroup.insertBefore(
                            this.createCustomShortcutElement(newShortcut, this.settings.customShortcuts.length - 1, customGroup),
                            addButton
                        );
                        this.saveSettings();
                    };
                    customGroup.appendChild(addButton);

                    // Config yönetimi bölümü
                    const configSection = document.createElement("div");
                    configSection.className = "flx-config-section";
                    configSection.innerHTML = `<div class="flx-group-title">Config Management</div>`;

                    const configButtons = document.createElement("div");
                    configButtons.className = "flx-button-group";

                    // Config kaydetme butonu
                    const saveConfigButton = document.createElement("button");
                    saveConfigButton.className = "flx-button save";
                    saveConfigButton.textContent = "Save as New Config";
                    saveConfigButton.onclick = () => {
                        BdApi.showConfirmationModal("Save Config",
                            BdApi.React.createElement("input", {
                                type: "text",
                                placeholder: "Enter config name",
                                id: "config-name-input",
                                style: {
                                    width: "100%",
                                    padding: "8px",
                                    marginTop: "10px",
                                    background: "var(--input-background)",
                                    border: "1px solid var(--input-border)",
                                    borderRadius: "3px",
                                    color: "var(--text-normal)"
                                }
                            }),
                            {
                                confirmText: "Save",
                                cancelText: "Cancel",
                                onConfirm: () => {
                                    const configName = document.getElementById("config-name-input").value;
                                    if (!configName) return;
                                    
                                    let configs = BdApi.Data.load("FLX-ShortCut", "configs") || {};
                                    configs[configName] = this.settings;
                                    BdApi.Data.save("FLX-ShortCut", "configs", configs);
                                    BdApi.UI.showToast(`Config "${configName}" saved!`, {type: "success"});
                                    updateConfigSelect();
                                }
                            }
                        );
                    };

                    // Config seçme dropdown'ı
                    const configSelect = document.createElement("select");
                    configSelect.className = "flx-button load";
                    configSelect.style.minWidth = "150px";

                    const updateConfigSelect = () => {
                        const configs = BdApi.Data.load("FLX-ShortCut", "configs") || {};
                        
                        // Aktif config'i bul
                        const currentSettings = JSON.stringify(this.settings);
                        let currentConfigName = "Select a Config";

                        for (const [configName, configData] of Object.entries(configs)) {
                            if (JSON.stringify(configData) === currentSettings) {
                                currentConfigName = configName;
                                break;
                            }
                        }

                        // Dropdown'ı temizle
                        configSelect.innerHTML = '';
                        
                        // İlk seçenek olarak aktif config'i ekle
                        const defaultOption = document.createElement("option");
                        defaultOption.value = "";
                        defaultOption.textContent = currentConfigName;
                        defaultOption.style.color = "var(--text-normal)";  // Rengi normal yap
                        defaultOption.style.opacity = "1";  // Opaklığı tam yap
                        defaultOption.disabled = true;
                        defaultOption.selected = true;
                        configSelect.appendChild(defaultOption);
                        
                        // Diğer configleri ekle (aktif config hariç)
                        Object.keys(configs)
                            .filter(name => name !== currentConfigName)
                            .sort()
                            .forEach(configName => {
                                const option = document.createElement("option");
                                option.value = configName;
                                option.textContent = configName;
                                option.style.color = "var(--text-normal)";  // Diğer seçeneklerin de rengi normal olsun
                                configSelect.appendChild(option);
                            });
                    };
                    updateConfigSelect();

                    configSelect.onchange = () => {
                        const selectedConfig = configSelect.value;
                        if (!selectedConfig) return;

                        const configs = BdApi.Data.load("FLX-ShortCut", "configs") || {};
                        if (configs[selectedConfig]) {
                            // Config'i derin kopyalama ile yükle
                            this.settings = JSON.parse(JSON.stringify(configs[selectedConfig]));
                            
                            // Ayarları kaydet
                            this.saveSettings();
                            
                            // UI'ı güncelle
                            const newPanel = this.getSettingsPanel();
                            panel.parentElement.replaceChild(newPanel, panel);

                            // Bildirim göster
                            BdApi.UI.showToast(`Config "${selectedConfig}" loaded!`, {type: "success"});
                        }
                    };

                    // Delete Config butonu
                    const deleteConfigButton = document.createElement("button");
                    deleteConfigButton.className = "flx-button reset";
                    deleteConfigButton.textContent = "Delete Config";
                    deleteConfigButton.onclick = () => {
                        // Aktif config'i bul
                        const configs = BdApi.Data.load("FLX-ShortCut", "configs") || {};
                        const currentSettings = JSON.stringify(this.settings);
                        let activeConfig = null;

                        for (const [configName, configData] of Object.entries(configs)) {
                            if (JSON.stringify(configData) === currentSettings) {
                                activeConfig = configName;
                                break;
                            }
                        }

                        if (!activeConfig) {
                            BdApi.UI.showToast("No active config to delete!", {type: "error"});
                            return;
                        }

                        BdApi.showConfirmationModal("Delete Config", 
                            `Are you sure you want to delete "${activeConfig}" config?`,
                            {
                                danger: true,
                                confirmText: "Delete",
                                cancelText: "Cancel",
                                onConfirm: () => {
                                    delete configs[activeConfig];
                                    BdApi.Data.save("FLX-ShortCut", "configs", configs);
                                    
                                    // Varsayılan ayarlara dön
                                    this.settings = this.defaultSettings;
                                    this.saveSettings();
                                    
                                    // UI'ı güncelle
                                    updateConfigSelect();
                                    const newPanel = this.getSettingsPanel();
                                    panel.parentElement.replaceChild(newPanel, panel);
                                    
                                    BdApi.UI.showToast(`Config "${activeConfig}" deleted!`, {type: "success"});
                                }
                            }
                        );
                    };

                    // Reset butonu
                    const resetButton = document.createElement("button");
                    resetButton.className = "flx-button reset";
                    resetButton.textContent = "Reset to Default";
                    resetButton.onclick = () => {
                        BdApi.showConfirmationModal("Reset Everything to Default", 
                            "Are you sure you want to reset everything to default?\n\n" +
                            "Following items will be deleted:\n\n" +
                            "1. All saved configs\n" +
                            "2. All custom shortcuts\n" +
                            "3. All current settings\n" +
                            "4. All shortcut texts\n" +
                            "5. All shortcut names\n\n" +
                            "Everything will be reset to default values.\n" +
                            "This action cannot be undone!",
                            {
                                danger: true,
                                confirmText: "Yes, Reset Everything",
                                cancelText: "Cancel",
                                onConfirm: () => {
                                    // Tüm configleri sil
                                    BdApi.Data.save("FLX-ShortCut", "configs", {});
                                    
                                    // Ayarları varsayılana döndür
                                    this.settings = this.defaultSettings;
                                    this.saveSettings();
                                    
                                    // UI'ı güncelle
                                    updateConfigSelect();
                                    const newPanel = this.getSettingsPanel();
                                    panel.parentElement.replaceChild(newPanel, panel);
                                    
                                    BdApi.UI.showToast("Everything has been reset to default!", {type: "success"});
                                }
                            }
                        );
                    };

                    configButtons.appendChild(saveConfigButton);
                    configButtons.appendChild(configSelect);
                    configButtons.appendChild(deleteConfigButton);
                    configButtons.appendChild(resetButton);
                    configSection.appendChild(configButtons);

                    // Geliştirici bilgisi
                    const developerInfo = document.createElement("div");
                    developerInfo.className = "flx-developer-info";
                    developerInfo.innerHTML = `
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm1.61-9.96c-2.06-.3-3.88.97-4.43 2.79-.18.58.26 1.17.87 1.17h.2c.41 0 .74-.29.88-.67.32-.89 1.27-1.5 2.3-1.28.95.2 1.65 1.13 1.57 2.1-.1 1.34-1.62 1.63-2.45 2.88 0 .01-.01.01-.01.02-.01.02-.02.03-.03.05-.09.15-.18.32-.25.5-.01.03-.03.05-.04.08-.01.02-.01.04-.02.07-.12.34-.2.75-.2 1.25h2c0-.42.11-.77.28-1.07.02-.03.03-.06.05-.09.08-.14.18-.27.28-.39.01-.01.02-.03.03-.04.1-.12.21-.23.33-.34.96-.91 2.26-1.65 1.99-3.56-.24-1.74-1.61-3.21-3.35-3.47z"/>
                        </svg>
                        <span>DEVELOPED BY <a href="https://github.com/ffelixxcom" target="_blank">FFELIXX.COM</a></span>
                    `;
                    configSection.appendChild(developerInfo);

                    panel.appendChild(defaultGroup);
                    panel.appendChild(customGroup);
                    panel.appendChild(configSection);

                    // Input değişikliklerini dinle
                    panel.addEventListener("change", (e) => {
                        const target = e.target;
                        if (target.id && target.id.includes("shortcut")) {
                            this.settings.shortcuts[target.id] = target.value;
                            this.saveSettings();
                        }
                    });

                    return panel;
                }

                createCustomShortcutElement(shortcut, index, parentElement) {
                    const setting = document.createElement("div");
                    setting.className = "flx-shortcut-setting";
                    
                    const deleteButton = document.createElement("button");
                    deleteButton.className = "flx-delete-button";
                    deleteButton.textContent = "X";
                    deleteButton.onclick = () => {
                        this.settings.customShortcuts.splice(index, 1);
                        BdApi.Data.save("FLX-ShortCut", "settings", this.settings);
                        setting.remove();
                        parentElement.parentElement.replaceWith(this.getSettingsPanel());
                    };

                    const nameInput = document.createElement("div");
                    nameInput.innerHTML = `
                        <label>Custom Shortcut Name</label>
                        <input type="text" value="${shortcut.name}" placeholder="Enter shortcut name">
                    `;

                    const textInput = document.createElement("div");
                    textInput.innerHTML = `
                        <label>Custom Shortcut Text</label>
                        <textarea placeholder="Enter shortcut text">${shortcut.text}</textarea>
                    `;

                    nameInput.querySelector("input").onchange = (e) => {
                        shortcut.name = e.target.value;
                        BdApi.Data.save("FLX-ShortCut", "settings", this.settings);
                    };

                    textInput.querySelector("textarea").onchange = (e) => {
                        shortcut.text = e.target.value;
                        BdApi.Data.save("FLX-ShortCut", "settings", this.settings);
                    };

                    setting.appendChild(deleteButton);
                    setting.appendChild(nameInput);
                    setting.appendChild(textInput);
                    return setting;
                }

                get shortcuts() {
                    const shortcuts = {};
                    for (let i = 1; i <= 2; i++) {
                        const name = this.settings.shortcuts[`shortcut${i}_name`];
                        const text = this.settings.shortcuts[`shortcut${i}_text`];
                        if (name && text) shortcuts[name] = text;
                    }
                    this.settings.customShortcuts?.forEach(shortcut => {
                        if (shortcut.name && shortcut.text) {
                            shortcuts[shortcut.name] = shortcut.text;
                        }
                    });
                    return shortcuts;
                }

                onStart() {
                    try {
                        // Ayarları kontrol et ve gerekirse varsayılanları yükle
                        if (!this.settings) {
                            this.settings = BdApi.Data.load("FLX-ShortCut", "settings") || this.defaultSettings;
                            BdApi.Data.save("FLX-ShortCut", "settings", this.settings);
                        }
                        
                        this.patchContextMenu();
                        Logger.info("Plugin enabled, context menu patched!");
                    } catch (err) {
                        Logger.info("Errored while patching.");
                        Logger.info(err);
                    }
                }

                onStop() {
                    this.contextMenuPatch?.();
                    Logger.info("Plugin disabled, context menu unpatched!");
                }

                sendMessage(message) {
                    const channelId = SelectedChannelStore.getChannelId();
                    if (!channelId) return;
                    MessageActions.sendMessage(channelId, {content: message});
                }

                patchContextMenu() {
                    const callback = (tree, props) => {
                        const shortcutGroup = ContextMenu.buildMenuChildren([
                            {
                                type: "group",
                                items: Object.entries(this.shortcuts).map(([label, text]) => ({
                                    type: "text",
                                    label: label,
                                    action: () => {
                                        this.sendMessage(text);
                                    }
                                }))
                            }
                        ]);

                        tree.props.children.splice(tree.props.children.length - 1, 0, shortcutGroup[0]);
                    };

                    this.contextMenuPatch = ContextMenu.patch("textarea-context", callback);
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
