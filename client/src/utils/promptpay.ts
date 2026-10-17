export const normalizePromptPayPhone = (phone: string) =>
  phone.replace(/\D/g, "").replace(/^66/, "0");

const tlv = (tag: string, value: string) => tag + String(value.length).padStart(2, "0") + value;

const crc16 = (text: string) => {
  let crc = 0xffff;
  for (const char of text) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

export const createPromptPayPayload = (phone: string, amount: number) => {
  const mobile = normalizePromptPayPhone(phone);
  if (!/^0[0-9]{9}$/.test(mobile)) return null;
  const promptPayAccount = tlv("00", "A000000677010111") + tlv("01", `0066${mobile.slice(1)}`);
  const amountValue = Math.max(0, amount).toFixed(2);
  const payload = "000201" + "010212" + tlv("29", promptPayAccount) + "5303764" + tlv("54", amountValue) + "5802TH" + "6304";
  return payload + crc16(payload);
};
