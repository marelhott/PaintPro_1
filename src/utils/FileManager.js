
// CENTRÁLNÍ FILE MANAGEMENT SYSTÉM
class FileManager {
  static async validateFile(file) {
    // Maximální velikost 10MB
    const maxSize = 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Soubor je příliš velký (maximum 10MB)' };
    }
    
    // Povolené typy souborů
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Nepodporovaný typ souboru' };
    }
    
    return { valid: true };
  }

  static async uploadFile(file, zakazkaId) {
    try {
      // Validace
      const validation = await FileManager.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Upload do localStorage jako base64
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = function(e) {
          const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            url: e.target.result, // base64 data URL
            uploadedAt: new Date().toISOString(),
            zakazkaId: zakazkaId
          };
          
          // Uložit do localStorage
          const existingFiles = JSON.parse(localStorage.getItem('paintpro_files') || '[]');
          existingFiles.push(fileData);
          localStorage.setItem('paintpro_files', JSON.stringify(existingFiles));
          
          resolve({ success: true, fileObject: fileData });
        };
        
        reader.onerror = function() {
          reject({ success: false, error: 'Chyba při čtení souboru' });
        };
        
        reader.readAsDataURL(file);
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static downloadFile(url, filename) {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Chyba při stahování souboru:', error);
      alert('Chyba při stahování souboru');
    }
  }

  static getFilesForOrder(zakazkaId) {
    const allFiles = JSON.parse(localStorage.getItem('paintpro_files') || '[]');
    return allFiles.filter(file => file.zakazkaId === zakazkaId);
  }
}

export default FileManager;
