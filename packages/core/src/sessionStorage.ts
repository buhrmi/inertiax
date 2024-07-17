export class SessionStorage {
  public static locationVisitKey = 'inertiaLocationVisit'

  public static set(key: string, value: any): void {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  }

  public static get(key: string): any {
    return JSON.parse(window.sessionStorage.getItem(key) || 'null')
  }

  public static merge(key: string, value: any): void {
    const existing = this.get(key)

    if (existing === null) {
      this.set(key, value)
    } else {
      this.set(key, JSON.stringify({ ...existing, ...value }))
    }
  }

  public static remove(key: string): void {
    window.sessionStorage.removeItem(key)
  }

  public static removeNested(key: string, nestedKey: string): void {
    const existing = this.get(key)

    if (existing !== null) {
      delete existing[nestedKey]

      this.set(key, existing)
    }
  }

  public static exists(key: string): boolean {
    try {
      return this.get(key) !== null
    } catch (error) {
      return false
    }
  }

  public static clear(): void {
    window.sessionStorage.clear()
  }
}