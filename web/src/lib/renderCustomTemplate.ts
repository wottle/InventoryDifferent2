type DeviceForTemplate = {
  id: number | string;
  name: string;
  additionalName?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  releaseYear?: number | null;
  info?: string | null;
  condition?: string | null;
  status?: string | null;
  category?: { name?: string | null } | null;
  location?: { name?: string | null } | null;
};

export function renderCustomTemplate(
  html: string,
  device: DeviceForTemplate,
  qrDataUri?: string
): string {
  const replacements: Record<string, string> = {
    'device.id': String(device.id ?? ''),
    'device.name': device.name ?? '',
    'device.additionalName': device.additionalName ?? '',
    'device.manufacturer': device.manufacturer ?? '',
    'device.modelNumber': device.modelNumber ?? '',
    'device.serialNumber': device.serialNumber ?? '',
    'device.releaseYear': device.releaseYear != null ? String(device.releaseYear) : '',
    'device.info': device.info ?? '',
    'device.condition': device.condition ?? '',
    'device.status': device.status ?? '',
    'device.category': device.category?.name ?? '',
    'device.location': device.location?.name ?? '',
    qr: qrDataUri ? `<img src="${qrDataUri}" style="width:80px;height:80px;" />` : '',
  };

  return Object.entries(replacements).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    html
  );
}
