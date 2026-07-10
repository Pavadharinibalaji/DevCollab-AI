/**
 * Centralized Clerk theme customization for DevCollab.
 * Enforces a premium dark neon cyberpunk theme with glassmorphic cards,
 * glowing fuchsia/purple accents, and large, highly legible OTP inputs.
 */
export const clerkTheme = {
  // Set the CSS layer name to 'clerk' so Tailwind v4 utility styles
  // take precedence over Clerk's internal stylesheets.
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#6e6aed",
    colorText: "#ececee",
    colorBackground: "#0b0813",
    colorInputBackground: "#0e0a16",
    colorInputText: "#ffffff",
    colorTextSecondary: "#a1a1aa",
    colorDanger: "#f43f5e",
    colorSuccess: "#10b981",
  },
  elements: {
    // Root container alignment
    rootBox: "w-full flex justify-center",

    // Main card design: dark matte background, glass blur, neon purple border and glow
    card: "bg-[#0b0813]/90 backdrop-blur-2xl border border-purple-500/20 shadow-[0_0_50px_-12px_rgba(110,106,237,0.35)] rounded-2xl p-6 sm:p-8 w-full max-w-md",

    // Header text styling
    headerTitle: "text-white font-extrabold text-2xl sm:text-3xl tracking-tight text-center drop-shadow-[0_2px_10px_rgba(110,106,237,0.3)]",
    headerSubtitle: "text-zinc-300 font-medium text-sm mt-2 text-center",

    // Social Authentication Buttons
    socialButtonsBlockButton:
      "border border-purple-500/20 bg-[#0e0a16]/80 hover:bg-[#150f24] text-zinc-100 font-bold transition-all duration-200 py-3 rounded-xl shadow-md",
    socialButtonsBlockButtonText: "font-bold text-zinc-100",

    // Separator line
    dividerLine: "bg-purple-950/40",
    dividerText: "text-zinc-500 font-bold text-xs uppercase tracking-wider",

    // Form Inputs & Labels
    formFieldLabel: "text-zinc-300 font-bold text-xs mb-1.5",
    formFieldInput:
      "border border-purple-500/20 bg-[#0e0a16]/95 text-white placeholder:text-zinc-500 rounded-xl px-4 py-3 text-sm focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30 focus:outline-none transition-all duration-200 shadow-inner",

    // Primary Action Button: Glowing Neon Purple/Fuchsia Gradient
    formButtonPrimary:
      "bg-gradient-to-r from-[#6e6aed] to-[#a855f7] hover:from-[#5b57d6] hover:to-[#9333ea] text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(110,106,237,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#a855f7]/50 cursor-pointer text-center",

    // Links and Footers
    footerActionText: "text-zinc-400 text-sm",
    footerActionLink:
      "text-[#a855f7] hover:text-[#c084fc] font-bold hover:underline transition-colors",

    // Verification Card Preview Box
    identityPreview:
      "bg-[#0e0a16]/80 border border-purple-950/40 rounded-xl px-4 py-3 flex items-center justify-between mt-4",
    identityPreviewText: "text-[#c084fc] font-extrabold text-sm drop-shadow-[0_0_6px_rgba(168,85,247,0.15)]",
    identityPreviewEditButton:
      "text-[#a855f7] hover:text-[#c084fc] font-bold text-xs hover:underline transition-colors",

    // OTP Input Boxes: Bigger, Glassmorphism background, Neon purple focus glow, bold white digits
    otpCodeFieldInput:
      "border-2 border-purple-500/30 bg-[#0e0a16]/90 text-white font-black text-3xl text-center rounded-xl focus:border-[#d946ef] focus:ring-4 focus:ring-[#d946ef]/35 focus:outline-none focus:bg-[#150f24] transition-all duration-300 w-12 h-16 sm:w-14 sm:h-18 flex items-center justify-center shadow-lg shadow-black/40 select-all caret-purple-500",
    otpCodeFieldInputs: "gap-3 sm:gap-4 justify-center py-4",

    // Link to resend code
    formResendCodeLink:
      "text-[#a855f7] hover:text-[#d946ef] font-bold text-sm hover:underline cursor-pointer transition-all duration-200 mt-2 block text-center drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]",

    // Secondary options
    alternativeMethodsBlockButton:
      "border border-purple-500/20 bg-[#0e0a16]/80 hover:bg-[#150f24] text-white font-bold transition-all py-3 rounded-xl shadow-md",
    backLink:
      "text-zinc-400 hover:text-white font-bold text-sm hover:underline transition-colors",

    // Form Messages
    formFieldWarningText: "text-amber-400 text-xs font-semibold mt-1",
    formFieldErrorText: "text-rose-400 text-xs font-semibold mt-1",
    formFieldHintText: "text-zinc-500 text-xs",

    // UserButton Popover Dropdown Styling
    userButtonPopoverCard: "bg-card border border-border/80 shadow-2xl rounded-xl p-1.5 min-w-[240px] text-foreground animate-in fade-in slide-in-from-top-1 duration-150",
    userButtonPopoverHeader: "p-2.5 border-b border-border/40 mb-1",
    userButtonPopoverMain: "space-y-0.5",
    userButtonPopoverUserPreview: "flex items-center gap-3 px-1 py-0.5",
    userButtonPopoverUserPreviewAvatarBox: "h-9 w-9 border border-border/30 rounded-full",

    // Text elements styled via objects for inline priority:
    userButtonPopoverUserPreviewMainIdentifier: {
      color: "#ececee",
      fontWeight: "600",
    },
    userButtonPopoverUserPreviewSecondaryIdentifier: {
      color: "#8b8b93",
      fontSize: "0.75rem",
    },
    userButtonPopoverActionButton: {
      color: "#ececee",
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: "0.5rem",
      borderRadius: "0.5rem",
      padding: "0.5rem 0.625rem",
      textAlign: "left",
      fontSize: "0.75rem",
      fontWeight: "500",
      transitionProperty: "all",
      cursor: "pointer",
    },
    userButtonPopoverActionButtonText: {
      color: "#ececee",
      fontWeight: "500",
    },
    userButtonPopoverActionButtonIcon: "text-muted-foreground opacity-80 h-4 w-4 shrink-0",
    userButtonPopoverFooter: "p-2 border-t border-border/30 mt-1 text-center",
    userButtonPopoverFooterLink: {
      color: "#8b8b93",
      fontSize: "10px",
      fontWeight: "500",
    },
    userButtonPopoverCustomItemButton: {
      color: "#ececee",
      display: "flex",
      width: "100%",
      alignItems: "center",
      gap: "0.5rem",
      borderRadius: "0.5rem",
      padding: "0.5rem 0.625rem",
      textAlign: "left",
      fontSize: "0.75rem",
      fontWeight: "500",
      transitionProperty: "all",
      cursor: "pointer",
    },
    userButtonPopoverCustomItemButtonText: {
      color: "#ececee",
      fontWeight: "500",
    },
    userButtonPopoverCustomItemButtonIcon: "text-muted-foreground opacity-80 h-4 w-4 shrink-0",
  },
};