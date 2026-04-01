import SwiftUI

struct LabeledField: View {
    let label: String
    @Binding var text: String
    var prompt: String = ""
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            TextField(prompt.isEmpty ? label : prompt, text: $text)
                .keyboardType(keyboardType)
        }
    }
}

struct LabeledTextEditor: View {
    let label: String
    @Binding var text: String
    var placeholder: String = "Additional information..."

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text(placeholder)
                        .foregroundColor(Color(.placeholderText))
                        .padding(.top, 8)
                        .padding(.leading, 4)
                }
                TextEditor(text: $text)
                    .frame(minHeight: 100)
            }
        }
    }
}
