; Hooks for Tauri's Windows installer (ADR-0015). Tauri reads this before its pages, so the first page's settings
; defined here go to the Welcome page: it gets a "Start Workstation with Windows" box, checked. The installer only
; hands the choice to the app, which saves it as its preference and owns the start entry (`src/start.rs`).

!include LogicLib.nsh
!include nsDialogs.nsh

; Where the choice waits for the app; `start::take_installer_choice` reads and removes it.
!define WORKSTATION_CHOICE_KEY "Software\com.nyaridev.workstation"
!define WORKSTATION_CHOICE_VALUE "StartWithSystem"

Var WorkstationStartBox
; Empty until the Welcome page shows: passive updates and silent installs skip it, and hand nothing over.
Var WorkstationStartWithSystem

; The Welcome page: the box under its text, checked unless the user unchecked it before going back.
!define MUI_PAGE_CUSTOMFUNCTION_SHOW WorkstationWelcomeShow
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE WorkstationWelcomeLeave

Function WorkstationWelcomeShow
  ${NSD_CreateCheckbox} 120u 172u 195u 12u "Start Workstation with Windows"
  Pop $WorkstationStartBox
  SetCtlColors $WorkstationStartBox "" "FFFFFF"
  ${If} $WorkstationStartWithSystem != ${BST_UNCHECKED}
    ${NSD_Check} $WorkstationStartBox
  ${EndIf}
FunctionEnd

Function WorkstationWelcomeLeave
  ${NSD_GetState} $WorkstationStartBox $WorkstationStartWithSystem
FunctionEnd

!macro NSIS_HOOK_POSTINSTALL
  ${If} $WorkstationStartWithSystem == ${BST_CHECKED}
    WriteRegDWORD HKCU "${WORKSTATION_CHOICE_KEY}" "${WORKSTATION_CHOICE_VALUE}" 1
  ${ElseIf} $WorkstationStartWithSystem == ${BST_UNCHECKED}
    WriteRegDWORD HKCU "${WORKSTATION_CHOICE_KEY}" "${WORKSTATION_CHOICE_VALUE}" 0
  ${EndIf}
!macroend

; A real uninstall removes the start entry the app made; an update keeps it.
!macro NSIS_HOOK_POSTUNINSTALL
  ${If} $UpdateMode <> 1
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${PRODUCTNAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "${PRODUCTNAME}"
    DeleteRegValue HKCU "${WORKSTATION_CHOICE_KEY}" "${WORKSTATION_CHOICE_VALUE}"
  ${EndIf}
!macroend
