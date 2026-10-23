// Transforme un numéro congolais en numéro WhatsApp : "0812345678" -> "243812345678"
export function toWhatsapp(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = '243' + digits.slice(1)
  return digits
}