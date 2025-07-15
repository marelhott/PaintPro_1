
class FileManager {
  constructor() {
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }

  // Validace souboru
  validateFile(file) {
    const errors = [];
    
    if (!file) {
      errors.push('Soubor nebyl vybrán');
      return { isValid: false, errors };
    }

    if (!this.allowedTypes.includes(file.type)) {
      errors.push(`Nepodporovaný typ souboru: ${file.type}`);
    }

    if (file.size > this.maxFileSize) {
      errors.push(`Soubor je příliš velký: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Konverze souboru na base64
  async convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result;
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          uploadDate: new Date().toISOString()
        };
        resolve(fileData);
      };
      
      reader.onerror = () => {
        reject(new Error('Chyba při čtení souboru'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Hlavní metoda pro upload
  async uploadFile(file, zakazkaId = null) {
    try {
      // Validace
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Konverze na base64
      const fileData = await this.convertToBase64(file);
      
      // Přidání metadata
      if (zakazkaId) {
        fileData.zakazkaId = zakazkaId;
      }

      console.log('✅ Soubor úspěšně zpracován:', fileData.name);
      return fileData;
    } catch (error) {
      console.error('❌ Chyba při upload souboru:', error);
      throw error;
    }
  }

  // Batch upload více souborů
  async uploadMultipleFiles(files, zakazkaId = null) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, zakazkaId);
        results.push(result);
      } catch (error) {
        errors.push({
          fileName: file.name,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // Odstranění souboru
  removeFile(soubory, fileName) {
    return soubory.filter(soubor => soubor.name !== fileName);
  }

  // Získání celkové velikosti souborů
  getTotalSize(soubory) {
    return soubory.reduce((total, soubor) => total + soubor.size, 0);
  }

  // Formátování velikosti
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Singleton instance
const fileManager = new FileManager();
export default fileManager;
