const API_URL = process.env.API_URL || 'http://api:4000';

async function gql(query, variables = {}) {
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}

const DEVICES_QUERY = `
  query GetDevices($where: DeviceWhereInput) {
    devices(where: $where) {
      id name additionalName manufacturer modelNumber releaseYear
      status functionalStatus rarity estimatedValue searchText
      category { id name type }
      location { id name }
      images { thumbnailPath isThumbnail thumbnailMode }
    }
  }
`;

const DEVICE_QUERY = `
  query GetDevice($where: DeviceWhereInput!) {
    device(where: $where) {
      id name additionalName manufacturer modelNumber serialNumber
      releaseYear info historicalNotes externalUrl status functionalStatus
      condition rarity isWifiEnabled hasOriginalBox isAssetTagged
      dateAcquired estimatedValue listPrice soldPrice soldDate lastPowerOnDate
      cpuType cpuSpeed ram graphicsChip screenSize displayType
      displayVariant nativeResolution
      category { id name type }
      location { id name }
      storageEntries { value sortOrder }
      osEntries { value sortOrder }
      images { path thumbnailPath caption isThumbnail thumbnailMode }
      notes { content date }
      maintenanceTasks { label dateCompleted notes cost }
      tags { name }
      customFieldValues { customFieldName value isPublic sortOrder }
      accessories { name }
      links { label url }
    }
  }
`;

const CATEGORIES_QUERY = `
  query GetCategories {
    categories { id name type sortOrder }
  }
`;

module.exports = { gql, DEVICES_QUERY, DEVICE_QUERY, CATEGORIES_QUERY };
