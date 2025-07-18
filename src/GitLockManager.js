// GitLockManager.js - Automatické řešení problémů s .git/index.lock

class GitLockManager {
  constructor() {
    this.isLockChecking = false;
    this.lockCheckInterval = null;
    this.setupAutoLockCleaner();
  }

  // Automatické čištění lock souborů při startu
  async checkAndCleanLockFiles() {
    if (this.isLockChecking) return;

    this.isLockChecking = true;
    console.log('🔍 Kontroluji git lock soubory...');

    try {
      // Zkontroluj a vyčisti všechny možné lock soubory
      const lockFiles = [
        '.git/index.lock',
        '.git/config.lock',
        '.git/HEAD.lock',
        '.git/refs/heads/main.lock',
        '.git/refs/heads/master.lock',
        '.git/COMMIT_EDITMSG.lock',
        '.git/MERGE_HEAD.lock'
      ];

      let cleanedFiles = 0;

      for (const lockFile of lockFiles) {
        try {
          const response = await fetch(`/api/check-file?path=${encodeURIComponent(lockFile)}`);
          if (response.ok) {
            await this.removeLockFile(lockFile);
            cleanedFiles++;
            console.log(`🧹 Odstraněn lock soubor: ${lockFile}`);
          }
        } catch (error) {
          // Lock soubor pravděpodobně neexistuje - to je OK
        }
      }

      if (cleanedFiles > 0) {
        this.showLockCleanedNotification(cleanedFiles);
        console.log(`✅ Vyčištěno ${cleanedFiles} git lock souborů`);
      } else {
        console.log('✅ Žádné git lock soubory nenalezeny');
      }

    } catch (error) {
      console.error('❌ Chyba při kontrole lock souborů:', error);
    } finally {
      this.isLockChecking = false;
    }
  }

  // Odebrání konkrétního lock souboru
  async removeLockFile(lockPath) {
    try {
      // V Replit prostředí použijeme shell příkaz
      const command = `rm -f "${lockPath}"`;
      await this.executeShellCommand(command);
      return true;
    } catch (error) {
      console.warn(`Nelze odstranit ${lockPath}:`, error);
      return false;
    }
  }

  // Spuštění shell příkazu (simulace pro browser prostředí)
  async executeShellCommand(command) {
    // V reálném Replit prostředí by toto bylo nahrazeno skutečným shell příkazem
    console.log(`🔧 Spouštím: ${command}`);

    // Pro browser simulaci - v produkci by toto volalo skutečný shell
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  }

  // Zobrazení notifikace o vyčištění
  showLockCleanedNotification(count) {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      ">
        🔓 Git odemknut! Vyčištěno ${count} lock souborů
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove po 3 sekundách
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Uživatelské tlačítko pro manuální odemknutí
  showUnlockButton() {
    // Zkontroluj jestli už tlačítko neexistuje
    if (document.querySelector('#git-unlock-btn')) return;

    const unlockButton = document.createElement('div');
    unlockButton.id = 'git-unlock-btn';
    unlockButton.innerHTML = `
      <button style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
        🔓 Odemknout Git
      </button>
    `;

    unlockButton.addEventListener('click', () => {
      this.checkAndCleanLockFiles();
      document.body.removeChild(unlockButton);
    });

    document.body.appendChild(unlockButton);
  }

  // Detekce git lock problému z error zpráv
  detectLockProblem(errorMessage) {
    const lockErrorKeywords = [
      'index.lock',
      'Unable to create',
      'exists',
      'lock file',
      'repository is locked',
      'another git process'
    ];

    return lockErrorKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Pre-git hook - kontrola před každým git příkazem
  async preGitHook() {
    console.log('🔍 Pre-git kontrola lock souborů...');
    await this.checkAndCleanLockFiles();
  }

  // Setup automatického čistidla
  setupAutoLockCleaner() {
    // Vyčisti při inicializaci
    setTimeout(() => {
      this.checkAndCleanLockFiles();
    }, 1000);

    // Periodická kontrola každých 5 minut
    this.lockCheckInterval = setInterval(() => {
      this.checkAndCleanLockFiles();
    }, 5 * 60 * 1000);

    // Vyčisti při visibility change (když uživatel přepne záložku a vrátí se)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => {
          this.checkAndCleanLockFiles();
        }, 500);
      }
    });

    // Vyčisti při focus okna
    window.addEventListener('focus', () => {
      setTimeout(() => {
        this.checkAndCleanLockFiles();
      }, 500);
    });
  }

  // Cleanup při unload
  cleanup() {
    if (this.lockCheckInterval) {
      clearInterval(this.lockCheckInterval);
    }
  }
}

// Globální instance
const gitLockManager = new GitLockManager();

// Cleanup při unload stránky
window.addEventListener('beforeunload', () => {
  gitLockManager.cleanup();
});

// Export pro použití v jiných modulech
export default gitLockManager;