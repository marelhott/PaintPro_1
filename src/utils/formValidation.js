
// Validační pravidla pro formuláře
class FormValidator {
  constructor() {
    this.rules = {
      required: (value) => value && value.toString().trim() !== '',
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      number: (value) => !isNaN(value) && isFinite(value),
      positiveNumber: (value) => !isNaN(value) && parseFloat(value) > 0,
      date: (value) => !isNaN(Date.parse(value)),
      minLength: (min) => (value) => value && value.length >= min,
      maxLength: (max) => (value) => value && value.length <= max,
      pattern: (regex) => (value) => regex.test(value)
    };
  }

  // Validace jednotlivého pole
  validateField(value, rules) {
    const errors = [];
    
    for (const rule of rules) {
      if (typeof rule === 'string') {
        // Jednoduchá pravidla
        if (!this.rules[rule](value)) {
          errors.push(this.getErrorMessage(rule, value));
        }
      } else if (typeof rule === 'object') {
        // Složitá pravidla s parametry
        const ruleName = rule.type;
        const ruleFunction = rule.params ? this.rules[ruleName](rule.params) : this.rules[ruleName];
        
        if (!ruleFunction(value)) {
          errors.push(rule.message || this.getErrorMessage(ruleName, value));
        }
      }
    }
    
    return errors;
  }

  // Validace celého formuláře
  validateForm(formData, validationSchema) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, rules] of Object.entries(validationSchema)) {
      const fieldErrors = this.validateField(formData[fieldName], rules);
      
      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  // Získání error zprávy
  getErrorMessage(ruleName, value) {
    const messages = {
      required: 'Toto pole je povinné',
      email: 'Neplatný formát emailu',
      number: 'Musí být číslo',
      positiveNumber: 'Musí být kladné číslo',
      date: 'Neplatný formát datumu',
      minLength: `Minimálně ${value} znaků`,
      maxLength: `Maximálně ${value} znaků`
    };

    return messages[ruleName] || 'Neplatná hodnota';
  }
}

// Validační schémata pro různé formuláře
export const validationSchemas = {
  zakazka: {
    datum: ['required', 'date'],
    druh: ['required'],
    klient: ['required'],
    cislo: ['required'],
    castka: ['required', 'positiveNumber'],
    delkaRealizace: ['required', 'positiveNumber'],
    typ: ['required']
  },
  
  user: {
    name: ['required', { type: 'minLength', params: 2, message: 'Jméno musí mít alespoň 2 znaky' }],
    avatar: ['required', { type: 'maxLength', params: 3, message: 'Avatar max 3 znaky' }],
    pin: ['required', { type: 'minLength', params: 4, message: 'PIN musí mít alespoň 4 znaky' }]
  },

  changePin: {
    currentPin: ['required', { type: 'minLength', params: 4, message: 'PIN musí mít alespoň 4 znaky' }],
    newPin: ['required', { type: 'minLength', params: 4, message: 'PIN musí mít alespoň 4 znaky' }],
    confirmPin: ['required', { type: 'minLength', params: 4, message: 'PIN musí mít alespoň 4 znaky' }]
  }
};

// Singleton instance
const formValidator = new FormValidator();
export default formValidator;
