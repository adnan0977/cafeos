import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useWindowsPWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isWindowsOS, setIsWindowsOS] = useState(false);

  useEffect(() => {
    // Check if running on Windows
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      setIsWindowsOS(/Windows|Win32|Win64|WOW64/i.test(ua));

      // Check if already launched as standalone window / PWA
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA] App was successfully installed to Windows Desktop/Launcher');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the Windows app install prompt');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the Windows app install prompt');
        return false;
      }
    } catch (err) {
      console.warn('[PWA] Install prompt error:', err);
      return false;
    }
  };

  const sanitizeOrgName = (name?: string) => {
    if (!name) return 'CafeOS';
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  };

  /**
   * Generates and downloads a ready-to-run Windows Batch file (.bat)
   * for CASHIER BILLING TERMINAL.
   */
  const downloadCashierLauncherBatch = (orgName: string = 'CafeOS') => {
    const safeOrg = sanitizeOrgName(orgName);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
    const targetUrl = `${currentOrigin}/?tab=windows_cashier&source=windows_kiosk`;

    const batContent = `@echo off
:: =========================================================================
:: ${orgName} - Windows Cashier Billing Terminal (Powered by CafeOS)
:: =========================================================================
title ${orgName} - Cashier Billing Terminal (Powered by CafeOS)
color 0B
echo =========================================================================
echo Starting ${orgName} Cashier Billing Terminal...
echo Powered by CafeOS Enterprise Architecture
echo Terminal Endpoint: ${targetUrl}
echo =========================================================================

:: Try launching in Microsoft Edge App/Kiosk Mode (native on Windows 10/11)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    echo Launching via Microsoft Edge Standalone App Window...
    start msedge.exe --app="${targetUrl}" --window-size=1280,800 --start-maximized
    exit
)

:: Fallback to Google Chrome App Mode
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    echo Launching via Google Chrome Standalone App Window...
    start chrome.exe --app="${targetUrl}" --window-size=1280,800 --start-maximized
    exit
)

:: Default Browser fallback
echo Launching in default system browser...
start "" "${targetUrl}"
exit
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Launch-${safeOrg}-Cashier-POS.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Generates PowerShell shortcut creator (.ps1) for CASHIER TERMINAL
   */
  const downloadCashierShortcutScript = (orgName: string = 'CafeOS') => {
    const safeOrg = sanitizeOrgName(orgName);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
    const targetUrl = `${currentOrigin}/?tab=windows_cashier`;

    const ps1Content = `# PowerShell script to create Windows Desktop Shortcut for ${orgName} Cashier
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\\${orgName} Cashier POS.lnk")
$Shortcut.TargetPath = "msedge.exe"
$Shortcut.Arguments = "--app=""${targetUrl}"" --start-maximized"
$Shortcut.Description = "${orgName} Windows Cashier Billing Terminal - Powered by CafeOS"
$Shortcut.Save()

Write-Host "Success! Cashier POS desktop shortcut created: $DesktopPath\\${orgName} Cashier POS.lnk" -ForegroundColor Green
Start-Sleep -Seconds 3
`;

    const blob = new Blob([ps1Content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Create-${safeOrg}-Cashier-Shortcut.ps1`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Generates and downloads a ready-to-run Windows Batch file (.bat)
   * for STOCKIST & INVENTORY TERMINAL.
   */
  const downloadStockistLauncherBatch = (orgName: string = 'CafeOS') => {
    const safeOrg = sanitizeOrgName(orgName);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
    const targetUrl = `${currentOrigin}/?tab=inventory&source=stockist_kiosk`;

    const batContent = `@echo off
:: =========================================================================
:: ${orgName} - Stockist & Warehouse Inventory Terminal (Powered by CafeOS)
:: =========================================================================
title ${orgName} - Stockist & Inventory Terminal (Powered by CafeOS)
color 0A
echo =========================================================================
echo Starting ${orgName} Stockist & Warehouse Inventory Terminal...
echo Powered by CafeOS Enterprise Architecture
echo Terminal Endpoint: ${targetUrl}
echo =========================================================================

:: Try launching in Microsoft Edge App/Kiosk Mode (native on Windows 10/11)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    echo Launching via Microsoft Edge Standalone App Window...
    start msedge.exe --app="${targetUrl}" --window-size=1366,768 --start-maximized
    exit
)

:: Fallback to Google Chrome App Mode
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    echo Launching via Google Chrome Standalone App Window...
    start chrome.exe --app="${targetUrl}" --window-size=1366,768 --start-maximized
    exit
)

:: Default Browser fallback
echo Launching in default system browser...
start "" "${targetUrl}"
exit
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Launch-${safeOrg}-Stockist-Inventory.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Generates PowerShell shortcut creator (.ps1) for STOCKIST TERMINAL
   */
  const downloadStockistShortcutScript = (orgName: string = 'CafeOS') => {
    const safeOrg = sanitizeOrgName(orgName);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000';
    const targetUrl = `${currentOrigin}/?tab=inventory`;

    const ps1Content = `# PowerShell script to create Windows Desktop Shortcut for ${orgName} Stockist
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\\${orgName} Stockist & Inventory.lnk")
$Shortcut.TargetPath = "msedge.exe"
$Shortcut.Arguments = "--app=""${targetUrl}"" --start-maximized"
$Shortcut.Description = "${orgName} Stockist & Inventory Management Terminal - Powered by CafeOS"
$Shortcut.Save()

Write-Host "Success! Stockist desktop shortcut created: $DesktopPath\\${orgName} Stockist & Inventory.lnk" -ForegroundColor Green
Start-Sleep -Seconds 3
`;

    const blob = new Blob([ps1Content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Create-${safeOrg}-Stockist-Shortcut.ps1`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Backwards compatibility aliases
  const downloadWindowsLauncherBatch = () => downloadCashierLauncherBatch('CafeOS');
  const downloadWindowsDesktopShortcutScript = () => downloadCashierShortcutScript('CafeOS');

  return {
    isInstallable,
    isInstalled,
    isWindowsOS,
    promptInstall,
    downloadCashierLauncherBatch,
    downloadCashierShortcutScript,
    downloadStockistLauncherBatch,
    downloadStockistShortcutScript,
    downloadWindowsLauncherBatch,
    downloadWindowsDesktopShortcutScript,
  };
}
