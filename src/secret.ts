/**
 * Represents a Secret value that shpuldn't be accidentally exposed
 */
export class Secret<T = string> {
   // @ts-ignore
   readonly #_value: T

   constructor(value: T) {
      this.#_value = value
   }

   // The only way to get the value — explicit and grep-able
   /**
    * Exposes the actual value of the Secret
    */
   expose(): T {
      return this.#_value
   }

   // Prevents console.log(secret) leaking it
   toString(): string {
      return '[Secret]'
   }

   // Prevents JSON.stringify leaking it
   toJSON(): string {
      return '[Secret]'
   }

   // Prevents util.inspect (Node.js console.log of objects) leaking it
   [Symbol.for('nodejs.util.inspect.custom')](): string {
      return '[Secret]'
   }
}