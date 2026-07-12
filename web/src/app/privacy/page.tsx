export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 11, 2026</p>

      <p className="mb-6">
        InventoryDifferent is a self-hosted application. This means your inventory
        data is stored on a server that <strong>you own and control</strong> — not on
        any server operated by the developer. The developer (Michael Wottle) does not
        have access to your data and does not collect, store, or transmit it.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data You Store</h2>
      <p className="mb-4">
        All inventory records, images, notes, financial data, and other content you
        enter into InventoryDifferent are stored exclusively on your self-hosted server.
        You are responsible for the security and backup of that server.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">iOS App — Device Permissions</h2>
      <p className="mb-2">The iOS app requests the following device permissions:</p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li>
          <strong>Camera</strong> — used to scan barcodes and QR codes to quickly
          locate devices in your inventory. Images are sent directly to your server;
          they are not stored on any third-party service.
        </li>
        <li>
          <strong>Microphone</strong> — used for voice input when chatting with the
          AI collection assistant. Audio is processed on-device by iOS speech
          recognition and converted to text before being sent to your server.
        </li>
        <li>
          <strong>Speech Recognition</strong> — used to convert spoken questions into
          text for the AI chat feature.
        </li>
        <li>
          <strong>Photo Library (write only)</strong> — used to save generated asset
          tag QR codes to your photo library when requested.
        </li>
      </ul>
      <p className="mb-4">
        None of the above data is sent to or stored by the developer.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">AI Chat Feature</h2>
      <p className="mb-4">
        The AI chat feature sends queries about your collection to your self-hosted
        server, which forwards them to an AI provider (such as OpenAI) using an API
        key that you supply. The developer does not operate or have access to the AI
        service used by your server.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Analytics and Tracking</h2>
      <p className="mb-4">
        The iOS app contains no analytics SDKs, no advertising SDKs, and no crash
        reporting that sends data to the developer. The web storefront component
        optionally supports Umami Analytics, a privacy-friendly analytics tool —
        this is configured by you on your own server and its data is not accessible
        to the developer.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Third-Party Services</h2>
      <p className="mb-4">
        The optional TemplatesDifferent remote template catalog is operated by the
        developer at{' '}
        <code className="text-sm bg-gray-100 px-1 rounded">
          api.templates.inventorydifferent.com
        </code>
        . When enabled, your server (not the iOS app directly) makes requests to
        this service to fetch device template data. No personally identifiable
        information is sent in these requests.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Retention</h2>
      <p className="mb-4">
        The developer retains no data about you or your collection. You can delete
        your data at any time by removing it from your server.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p className="mb-4">
        Questions about this policy can be directed to{' '}
        <a href="mailto:mike@wottle.com" className="text-blue-600 hover:underline">
          mike@wottle.com
        </a>
        .
      </p>
    </div>
  );
}
