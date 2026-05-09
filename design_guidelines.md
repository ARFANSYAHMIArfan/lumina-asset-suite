{
  "meta": {
    "product_name": "Lumina Asset Suite",
    "doc_purpose": "Operator-first broadcast/MCR design system for a web-based video switcher + audio mixer + asset/queue manager.",
    "style_keywords": [
      "technical dark mode",
      "carbon black",
      "bento grid",
      "high-contrast",
      "broadcast software (OBS/vMix/Resolume-inspired)",
      "monospace technical readouts",
      "uncluttered despite complexity"
    ],
    "critical_rules": {
      "framework": "React (JS) + Tailwind + shadcn/ui",
      "no_tsx": true,
      "data_testid_required": "All interactive + key informational elements must include data-testid in kebab-case."
    }
  },

  "design_personality": {
    "brand_attributes": [
      "reliable under stress",
      "precise",
      "industrial",
      "fast-feedback",
      "operator-grade"
    ],
    "visual_metaphor": "Master Control Room: bounded modules, clear buses, unmistakable LIVE state, tactile controls.",
    "anti_goals": [
      "generic SaaS dashboard look",
      "centered marketing layout",
      "overuse of gradients",
      "tiny hit targets",
      "ambiguous LIVE vs PREVIEW"
    ]
  },

  "inspiration_refs": {
    "layout_inception": {
      "source": "Bento grid dashboard patterns + broadcast multiview mental model",
      "notes": "Use strict compartmentalization (tiles/panels) with consistent gutters; prioritize Program (LIVE) tile size and persistent status strip."
    },
    "ui_patterns": [
      {
        "name": "OBS Studio - Studio Mode",
        "takeaway": "Side-by-side Preview/Program with a central TAKE/CUT action and clear tally states."
      },
      {
        "name": "vMix / Resolume",
        "takeaway": "Industrial dark surfaces, bounded modules, dense but readable controls, strong active-state glows."
      }
    ],
    "web_sources_used": [
      {
        "title": "Bento grid dashboard design references",
        "url": "https://www.orbix.studio/blogs/bento-grid-dashboard-design-aesthetics"
      },
      {
        "title": "Resolume streaming/support (workflow context)",
        "url": "https://resolume.com/support/en/streaming"
      },
      {
        "title": "OBS forum: live preview multiple sources (workflow context)",
        "url": "https://obsproject.com/forum/threads/live-preview-multiple-sources.75398/"
      },
      {
        "title": "Pantone-like orange reference (hex/hsl lookup)",
        "url": "https://icolorpalette.com/color/F4633A"
      }
    ]
  },

  "color_system": {
    "usage_priority": [
      "Solid carbon backgrounds for all reading/control areas",
      "Orange only for active/armed/preview accents and primary actions",
      "Red only for LIVE/ON AIR and destructive",
      "Green only for ARMED/READY confirmations",
      "Gradients only as subtle section background overlays (<=20% viewport)"
    ],
    "palette_hex_hsl": {
      "bg": {
        "deep_black": { "hex": "#0A0A0A", "hsl": "hsl(0 0% 4%)" },
        "carbon": { "hex": "#161616", "hsl": "hsl(0 0% 9%)" },
        "surface": { "hex": "#1F1F1F", "hsl": "hsl(0 0% 12%)" },
        "surface_2": { "hex": "#262626", "hsl": "hsl(0 0% 15%)" },
        "panel": { "hex": "#121212", "hsl": "hsl(0 0% 7%)" },
        "panel_elevated": { "hex": "#1A1A1A", "hsl": "hsl(0 0% 10%)" }
      },
      "borders": {
        "hairline": { "hex": "#2A2A2A", "hsl": "hsl(0 0% 16%)" },
        "divider": { "hex": "#303030", "hsl": "hsl(0 0% 19%)" }
      },
      "text": {
        "primary": { "hex": "#F5F5F5", "hsl": "hsl(0 0% 96%)" },
        "secondary": { "hex": "#CFCFCF", "hsl": "hsl(0 0% 81%)" },
        "muted": { "hex": "#9A9A9A", "hsl": "hsl(0 0% 60%)" },
        "disabled": { "hex": "#6F6F6F", "hsl": "hsl(0 0% 44%)" }
      },
      "accents": {
        "lumina_orange": { "hex": "#FF6B1A", "hsl": "hsl(20 100% 55%)" },
        "lumina_orange_hover": { "hex": "#FF8240", "hsl": "hsl(20 100% 63%)" },
        "lumina_orange_dim": { "hex": "#C84F12", "hsl": "hsl(20 83% 43%)" },
        "live_red": { "hex": "#EF2D2D", "hsl": "hsl(0 85% 56%)" },
        "live_red_dim": { "hex": "#B81F1F", "hsl": "hsl(0 71% 42%)" },
        "armed_green": { "hex": "#2EE59D", "hsl": "hsl(155 76% 54%)" },
        "warning_amber": { "hex": "#FFB020", "hsl": "hsl(38 100% 56%)" }
      },
      "data_viz": {
        "vu_green": { "hex": "#2EE59D", "hsl": "hsl(155 76% 54%)" },
        "vu_yellow": { "hex": "#FFD166", "hsl": "hsl(40 100% 70%)" },
        "vu_red": { "hex": "#EF2D2D", "hsl": "hsl(0 85% 56%)" },
        "spectrum_blue": { "hex": "#4CC9F0", "hsl": "hsl(195 84% 62%)" }
      }
    },

    "tailwind_mapping_notes": {
      "approach": "Use shadcn CSS variables in index.css (dark mode default) and map Tailwind theme colors to CSS vars where needed. Keep surfaces solid; use orange/red as accents only.",
      "recommended_css_vars": {
        "--background": "0 0% 4%",
        "--foreground": "0 0% 96%",
        "--card": "0 0% 9%",
        "--card-foreground": "0 0% 96%",
        "--popover": "0 0% 9%",
        "--popover-foreground": "0 0% 96%",
        "--primary": "20 100% 55%",
        "--primary-foreground": "0 0% 4%",
        "--secondary": "0 0% 12%",
        "--secondary-foreground": "0 0% 96%",
        "--muted": "0 0% 15%",
        "--muted-foreground": "0 0% 60%",
        "--accent": "0 0% 15%",
        "--accent-foreground": "0 0% 96%",
        "--destructive": "0 85% 56%",
        "--destructive-foreground": "0 0% 96%",
        "--border": "0 0% 16%",
        "--input": "0 0% 16%",
        "--ring": "20 100% 55%",
        "--radius": "0.75rem"
      }
    },

    "allowed_gradients": {
      "rule": "Gradients are decorative overlays only (<=20% viewport). Never on text-heavy panels or small UI elements.",
      "safe_examples": [
        {
          "name": "Top status wash (very subtle)",
          "css": "radial-gradient(1200px 400px at 20% 0%, rgba(255,107,26,0.10), transparent 60%), radial-gradient(900px 300px at 80% 0%, rgba(239,45,45,0.06), transparent 55%)"
        }
      ]
    }
  },

  "typography": {
    "font_pairing": {
      "display_and_ui": {
        "name": "Space Grotesk",
        "fallback": "ui-sans-serif, system-ui",
        "usage": "Headings, navigation, buttons (modern technical feel without being 'developer tool' cliché)."
      },
      "mono_technical": {
        "name": "JetBrains Mono",
        "fallback": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        "usage": "Timecode, dB, Hz labels, file sizes, frame rate, device IDs."
      }
    },
    "google_fonts_import": {
      "note": "Add to index.html or via CSS import (prefer index.html for performance).",
      "urls": [
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      ]
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "body": "text-sm md:text-base text-foreground/90",
      "small": "text-xs text-muted-foreground",
      "mono_readout": "font-mono text-xs md:text-sm tracking-tight tabular-nums"
    },
    "numeric_readability": {
      "tailwind": "[font-variant-numeric:tabular-nums]",
      "use_for": ["timecode", "meters", "gain", "durations", "file sizes"]
    }
  },

  "spacing_and_grid": {
    "spacing_scale": {
      "xs": "2 (0.5rem)",
      "sm": "3 (0.75rem)",
      "md": "4 (1rem)",
      "lg": "6 (1.5rem)",
      "xl": "8 (2rem)",
      "2xl": "10 (2.5rem)"
    },
    "bento_grid_rules": {
      "gutter": "gap-4 (16px) default; gap-3 on small screens",
      "panel_padding": "p-3 md:p-4",
      "panel_radius": "rounded-xl",
      "panel_border": "border border-border/80",
      "panel_bg": "bg-card",
      "panel_shadow": "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
    },
    "workstation_breakpoints": {
      "minimum": "1920x800",
      "layout_behavior": "At <1024px, stack STAGING above LIVE; TAKE becomes sticky between panels; bottom deck becomes collapsible accordion."
    }
  },

  "layout_specs": {
    "routes": {
      "/login": {
        "layout": "Two-column on desktop: left brand panel (subtle orange wash), right auth card. Single column on mobile.",
        "key_components": ["Card", "Input", "Button", "Separator"],
        "notes": "Keep it operator-grade: minimal marketing, emphasize reliability + quick access."
      },
      "/signup": {
        "layout": "Same as /login for consistency.",
        "notes": "Use inline validation + clear error toasts (sonner)."
      },
      "/app": {
        "layout": {
          "top_bar": "Fixed height 56px; left logo + suite name; center LIVE indicator; right pop-out + user menu.",
          "left_sidebar": "Collapsible; Tabs for Library/Queue/History; includes search + filters.",
          "center_stage": "Two equal panels: STAGING (left) and LIVE (right) with TAKE column between.",
          "bottom_control_deck": "Docked panel (sticky bottom) with transport row + audio row. Must not overlap video panels at 1920x800."
        },
        "bento_map": [
          "Sidebar tile: Library/Queue/History",
          "Main tile A: STAGING player",
          "Main tile B: LIVE player",
          "Center tile: TAKE/CUT + transition selector",
          "Bottom tile row: Transport + progress",
          "Bottom tile row: Master fader + EQ + output routing + VU"
        ]
      },
      "/display": {
        "layout": "Fullscreen black. Only LIVE video. Optional minimal HUD (top-left) with timecode + LIVE dot; hideable.",
        "notes": "No controls. Ensure no accidental focus outlines; keep keyboard ESC to close optional."
      }
    }
  },

  "component_patterns": {
    "component_path": {
      "shadcn_primary": "/app/frontend/src/components/ui",
      "use_components": [
        "button.jsx",
        "card.jsx",
        "tabs.jsx",
        "badge.jsx",
        "select.jsx",
        "slider.jsx",
        "progress.jsx",
        "scroll-area.jsx",
        "separator.jsx",
        "tooltip.jsx",
        "dialog.jsx",
        "dropdown-menu.jsx",
        "resizable.jsx",
        "sonner.jsx"
      ]
    },

    "panels_and_cards": {
      "base_panel_class": "rounded-xl border border-border/80 bg-card text-card-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
      "header_row": "flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2",
      "title": "text-sm font-medium tracking-tight",
      "meta": "text-xs text-muted-foreground font-mono [font-variant-numeric:tabular-nums]",
      "empty_state": "flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground"
    },

    "badges": {
      "staging_badge": {
        "label": "STAGING",
        "class": "inline-flex items-center gap-2 rounded-md border border-[rgba(255,107,26,0.35)] bg-[rgba(255,107,26,0.10)] px-2 py-1 text-xs font-semibold text-[rgba(255,107,26,0.95)]",
        "dot": "h-2 w-2 rounded-full bg-[#FF6B1A] shadow-[0_0_0_3px_rgba(255,107,26,0.15)]"
      },
      "live_badge": {
        "label": "LIVE",
        "class": "inline-flex items-center gap-2 rounded-md border border-[rgba(239,45,45,0.45)] bg-[rgba(239,45,45,0.12)] px-2 py-1 text-xs font-semibold text-[rgba(239,45,45,0.95)]",
        "dot": "h-2 w-2 rounded-full bg-[#EF2D2D] shadow-[0_0_0_4px_rgba(239,45,45,0.18)]",
        "blink_animation": "animate-[lumina-live-blink_1s_steps(2,end)_infinite]"
      }
    },

    "live_output_indicator": {
      "placement": "Top bar center-left (always visible). Duplicate small indicator inside LIVE panel header.",
      "pattern": "Red dot + 'ON AIR' text + subtle pulsing glow. Must be readable at a glance.",
      "class": "inline-flex items-center gap-2 rounded-lg border border-[rgba(239,45,45,0.45)] bg-[rgba(10,10,10,0.6)] px-3 py-1.5",
      "text_class": "font-mono text-xs tracking-[0.12em] text-[#F5F5F5]",
      "dot_class": "h-2.5 w-2.5 rounded-full bg-[#EF2D2D] shadow-[0_0_0_6px_rgba(239,45,45,0.18)]",
      "blink": "animate-[lumina-live-blink_1s_steps(2,end)_infinite]"
    },

    "buttons": {
      "global_rules": {
        "hit_target": "min-h-10 (>=40px), prefer min-h-11 for primary operator actions",
        "focus": "focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "no_transition_all": true
      },
      "primary_orange": {
        "use": "Primary actions (Upload, Add to Queue, Confirm).",
        "class": "bg-[#FF6B1A] text-[#0A0A0A] hover:bg-[#FF8240] active:bg-[#C84F12] transition-colors",
        "data_testid_examples": ["asset-upload-button", "queue-add-button"]
      },
      "ghost_technical": {
        "use": "Icon buttons in transport/top bar.",
        "class": "bg-transparent hover:bg-white/5 active:bg-white/8 border border-border/70 transition-colors"
      },
      "take_button": {
        "label": "TAKE",
        "use": "Commit STAGING -> LIVE",
        "shape": "Rounded-2xl, tall, tactile",
        "class": "relative min-h-14 w-full rounded-2xl bg-[#FF6B1A] text-[#0A0A0A] font-semibold tracking-wide shadow-[0_10px_30px_rgba(255,107,26,0.18)] hover:bg-[#FF8240] active:bg-[#C84F12] transition-colors",
        "press_feedback": "active:translate-y-[1px]",
        "micro_interaction": "On click: brief flash on LIVE panel border + crossfade overlay.",
        "data_testid": "take-transition-button"
      },
      "cut_button": {
        "label": "CUT",
        "use": "Instant switch",
        "class": "min-h-12 w-full rounded-xl bg-[rgba(239,45,45,0.14)] text-[#F5F5F5] border border-[rgba(239,45,45,0.35)] hover:bg-[rgba(239,45,45,0.20)] transition-colors",
        "data_testid": "cut-transition-button"
      },
      "popout_display": {
        "label": "Pop-out Display",
        "use": "Open /display window",
        "class": "rounded-lg border border-border/80 bg-card hover:bg-white/5 transition-colors",
        "icon": "lucide-react: ExternalLink",
        "data_testid": "popout-display-button"
      }
    },

    "players": {
      "video_surface": {
        "class": "relative aspect-video w-full overflow-hidden rounded-lg bg-[#0A0A0A] ring-1 ring-border/70",
        "safe_area_overlay": "Optional: 4:3 + title-safe guides using absolute inset-0 pointer-events-none opacity-20"
      },
      "staging_panel": {
        "border_state": "ring-1 ring-[rgba(255,107,26,0.35)]",
        "glow": "shadow-[0_0_0_1px_rgba(255,107,26,0.10),0_0_24px_rgba(255,107,26,0.08)]"
      },
      "live_panel": {
        "border_state": "ring-1 ring-[rgba(239,45,45,0.40)]",
        "glow": "shadow-[0_0_0_1px_rgba(239,45,45,0.12),0_0_28px_rgba(239,45,45,0.10)]"
      },
      "transition_feedback": {
        "pattern": "When TAKE: show 180ms crossfade overlay on LIVE panel + 1px border pulse.",
        "implementation_hint": "Use Framer Motion AnimatePresence for overlay div; keep it lightweight to avoid video stutter."
      }
    },

    "transport_controls": {
      "layout": "Left cluster: prev/play/pause/stop/next. Center: timecode. Right: loop/autoplay toggles.",
      "timecode": {
        "format": "HH:MM:SS:FF",
        "class": "font-mono text-sm md:text-base tracking-[0.18em] text-[#F5F5F5] [font-variant-numeric:tabular-nums]",
        "data_testid": "transport-timecode"
      },
      "icon_buttons": {
        "class": "h-11 w-11 rounded-lg border border-border/70 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors",
        "icons": "lucide-react (Play, Pause, Square, SkipBack, SkipForward)",
        "data_testid_examples": [
          "transport-play-button",
          "transport-pause-button",
          "transport-stop-button",
          "transport-prev-button",
          "transport-next-button"
        ]
      }
    },

    "progress_bar": {
      "pattern": "Scrubbable timeline with buffered indicator + playhead. Timecode on both ends.",
      "shadcn": "progress.jsx for base; slider.jsx for scrubbing interaction",
      "classes": {
        "track": "h-2 rounded-full bg-white/10",
        "fill": "h-2 rounded-full bg-[#FF6B1A]",
        "thumb": "h-4 w-4 rounded-full bg-[#FF6B1A] ring-2 ring-[#0A0A0A]"
      },
      "data_testid": {
        "scrub_slider": "timeline-scrub-slider",
        "timecode_left": "timeline-timecode-current",
        "timecode_right": "timeline-timecode-duration"
      }
    },

    "audio": {
      "master_gain_fader": {
        "pattern": "Vertical fader with dB scale and peak hold.",
        "implementation": "Use shadcn Slider rotated or custom vertical slider wrapper; keep hit target wide.",
        "classes": {
          "container": "flex flex-col items-center gap-3",
          "scale": "font-mono text-[10px] text-muted-foreground",
          "fader_track": "h-40 w-3 rounded-full bg-white/10",
          "fader_thumb": "h-6 w-6 rounded-lg bg-[#FF6B1A] shadow-[0_8px_20px_rgba(255,107,26,0.18)]"
        },
        "data_testid": "master-gain-fader"
      },
      "eq_10_band": {
        "bands_hz": [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
        "pattern": "10 vertical sliders with Hz labels (mono) + subtle spectrum line behind.",
        "classes": {
          "grid": "grid grid-cols-10 gap-2",
          "band": "flex flex-col items-center gap-2",
          "hz_label": "font-mono text-[10px] text-muted-foreground",
          "slider": "[&_[data-slot=track]]:bg-white/10 [&_[data-slot=range]]:bg-[#2EE59D]"
        },
        "data_testid_prefix": "eq-band",
        "example": "data-testid=\"eq-band-1000hz-slider\""
      },
      "vu_meter": {
        "pattern": "Vertical or horizontal bar meter with green->yellow->red zones + peak hold tick.",
        "implementation_hint": "Use a div-based meter for performance; update via requestAnimationFrame at ~30fps (not 60) to reduce CPU.",
        "classes": {
          "meter_bg": "h-28 w-3 rounded-full bg-white/10 overflow-hidden",
          "meter_fill": "w-full rounded-full",
          "zones": "Use gradient only inside meter fill (allowed because it is not a UI gradient background and is functional)."
        },
        "data_testid": "master-vu-meter"
      },
      "output_selector": {
        "shadcn": "select.jsx",
        "class": "bg-card border-border/80",
        "data_testid": "audio-output-device-select"
      }
    },

    "lists": {
      "asset_library_grid": {
        "pattern": "Dense thumbnail cards with type badge, duration, size; hover reveals quick actions.",
        "grid": "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4",
        "card": "group rounded-xl border border-border/80 bg-card hover:bg-white/3 transition-colors",
        "thumb": "aspect-video rounded-lg bg-[#0A0A0A] ring-1 ring-border/70",
        "meta_row": "mt-2 flex items-center justify-between gap-2",
        "badges": {
          "video": "bg-white/5 border-border/70 text-foreground",
          "audio": "bg-white/5 border-border/70 text-foreground"
        },
        "data_testid_prefix": "asset-card"
      },
      "queue_list": {
        "pattern": "Sortable/draggable rows; current item has orange left rail + play icon.",
        "row": "flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2 hover:bg-white/5 transition-colors",
        "current": "border-[rgba(255,107,26,0.35)] bg-[rgba(255,107,26,0.06)]",
        "drag_handle": "cursor-grab active:cursor-grabbing",
        "data_testid": {
          "list": "queue-list",
          "row_prefix": "queue-item",
          "current": "queue-current-item"
        }
      },
      "history_list": {
        "pattern": "Reverse chronological; timestamp mono; subtle separators.",
        "row": "flex items-start justify-between gap-3 py-2",
        "timestamp": "font-mono text-[11px] text-muted-foreground",
        "data_testid": "history-list"
      }
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Motion communicates state changes (TAKE, LIVE, armed).",
      "Keep animations short (120–220ms) and avoid affecting video playback.",
      "Prefer opacity/border-shadow changes over large transforms in dense UI."
    ],
    "durations": {
      "fast": "120ms",
      "base": "180ms",
      "slow": "240ms"
    },
    "easings": {
      "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "snappy": "cubic-bezier(0.2, 1, 0.2, 1)"
    },
    "key_animations_css": {
      "add_to_index_css": "@keyframes lumina-live-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.35; } }\n@keyframes lumina-border-pulse { 0% { box-shadow: 0 0 0 0 rgba(239,45,45,0.0); } 40% { box-shadow: 0 0 0 2px rgba(239,45,45,0.22); } 100% { box-shadow: 0 0 0 0 rgba(239,45,45,0.0); } }"
    },
    "take_transition": {
      "sequence": [
        "TAKE press: button active translate-y 1px",
        "LIVE panel: overlay fade-in 80ms then fade-out 120ms",
        "LIVE border: pulse once (lumina-border-pulse 220ms)"
      ]
    },
    "hover_states": {
      "panels": "hover:bg-white/3 (very subtle), no scale",
      "buttons": "hover:bg-white/5 for ghost; hover orange for primary",
      "list_rows": "hover highlight + show quick actions"
    },
    "reduced_motion": {
      "rule": "Respect prefers-reduced-motion: disable blinking and pulses; replace with solid red indicator + label.",
      "tailwind": "motion-reduce:animate-none motion-reduce:transition-none"
    }
  },

  "data_models_mock": {
    "asset": {
      "id": "asset_01",
      "type": "video | audio",
      "title": "Opening Sting",
      "durationFrames": 5420,
      "fps": 25,
      "sizeBytes": 104857600,
      "thumbnailUrl": "(optional)",
      "r2Url": "https://...",
      "tags": ["intro", "event"],
      "createdAt": "2026-05-01T12:00:00Z"
    },
    "queueItem": {
      "id": "q_01",
      "assetId": "asset_01",
      "order": 1,
      "autoplayNext": true,
      "inPointFrames": 0,
      "outPointFrames": 5420
    },
    "audioState": {
      "masterGainDb": -6.0,
      "eqBands": {
        "31": 0.0,
        "62": 0.0,
        "125": 0.0,
        "250": 0.0,
        "500": 0.0,
        "1000": 0.0,
        "2000": 0.0,
        "4000": 0.0,
        "8000": 0.0,
        "16000": 0.0
      },
      "vu": {
        "rms": -18.2,
        "peak": -6.4,
        "peakHold": -5.8
      },
      "outputDeviceId": "default"
    },
    "busState": {
      "stagingAssetId": "asset_01",
      "liveAssetId": "asset_02",
      "isLive": true,
      "transition": "take | cut | fade",
      "lastTakeAt": "2026-05-01T12:34:56Z"
    }
  },

  "libraries_and_integrations": {
    "recommended": [
      {
        "name": "framer-motion",
        "why": "Lightweight UI state transitions (TAKE overlay, panel pulses) without touching video rendering.",
        "install": "npm i framer-motion",
        "usage_hint_js": "Use <AnimatePresence> for overlay divs; keep animations opacity-only."
      },
      {
        "name": "recharts",
        "why": "Optional EQ spectrum visualization (static/low-FPS) and meters.",
        "install": "npm i recharts",
        "usage_hint_js": "Render a small LineChart behind EQ sliders; update at low frequency (e.g., 10–15fps)."
      }
    ],
    "do_not_use": [
      "Heavy canvas animations near video surfaces",
      "Global CSS transitions",
      "Multiple stacked gradients"
    ]
  },

  "image_urls": {
    "note": "This is an operator dashboard; avoid stock photography in-app. Use subtle noise textures only.",
    "textures": [
      {
        "category": "noise-overlay",
        "description": "Very subtle grain/noise overlay (CSS-based preferred).",
        "url": "(use CSS noise; no external image required)"
      }
    ],
    "login_brand_panel": [
      {
        "category": "abstract-dark",
        "description": "Optional abstract dark texture for login left panel (keep subtle, low contrast).",
        "url": "(optional; keep empty unless needed)"
      }
    ]
  },

  "instructions_to_main_agent": {
    "global_theming": [
      "Make dark mode the default by setting :root tokens to carbon palette (do not rely on current light defaults in index.css).",
      "Remove/ignore App.css centered header styles; do not center the app container.",
      "Use Space Grotesk for UI and JetBrains Mono for technical readouts; apply tabular-nums to all numeric readouts.",
      "Keep surfaces solid; use orange/red only for accents and state."
    ],
    "page_build_order": [
      "1) /login + /signup (auth shell + tokens)",
      "2) /app layout skeleton (top bar, sidebar, staging/live, bottom deck)",
      "3) Core interactions: TAKE/CUT, queue selection, pop-out display",
      "4) Audio deck: master fader, EQ, output routing, VU",
      "5) /display minimal view + BroadcastChannel sync"
    ],
    "testing_ids": {
      "must_include": [
        "live-output-indicator",
        "popout-display-button",
        "take-transition-button",
        "cut-transition-button",
        "timeline-scrub-slider",
        "transport-timecode",
        "audio-output-device-select",
        "master-gain-fader",
        "master-vu-meter",
        "queue-list",
        "history-list"
      ]
    }
  },

  "general_ui_ux_design_guidelines_appendix": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n- You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n- NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
