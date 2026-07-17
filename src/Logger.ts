export function traceAll(instance: any) {
    const className = instance.constructor.name;
    // On récupère le prototype de la classe (là où sont stockées les méthodes)
    const prototype = Object.getPrototypeOf(instance);
    // On récupère les noms de tout ce qui est défini dans la classe
    const methods = Object.getOwnPropertyNames(prototype);
  
    for (const methodName of methods) {
      // On ignore le constructeur
      if (methodName === 'constructor') continue;
  
      const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
      
      // On vérifie que c'est bien une fonction/méthode
      if (descriptor && typeof descriptor.value === 'function') {
        const original = instance[methodName];
        
        // On remplace la méthode originale par notre version espionne
        instance[methodName] = function (...args: any[]) {
          console.log(
            `🔌 [CALL] %c${className}.${methodName}()`, 
            "color: #00ff88; font-weight: bold;", 
            args.length ? "avec :" : "", 
            args.length ? args : ""
          );
          return original.apply(this, args);
        };
      }
    }
  }