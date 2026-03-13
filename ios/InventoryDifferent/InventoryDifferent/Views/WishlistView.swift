//
//  WishlistView.swift
//  InventoryDifferent
//

import SwiftUI
import Combine

@MainActor
class WishlistViewModel: ObservableObject {
    @Published var items: [WishlistItem] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var categories: [Category] = []

    private let service = DeviceService.shared

    var existingGroups: [String] {
        let groups = items.compactMap { $0.group?.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        return Array(Set(groups)).sorted()
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            async let itemsResult = service.fetchWishlistItems()
            async let categoriesResult = service.fetchCategories()
            let (fetchedItems, fetchedCategories) = try await (itemsResult, categoriesResult)
            items = fetchedItems
            categories = fetchedCategories
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func delete(item: WishlistItem) async {
        do {
            _ = try await service.deleteWishlistItem(id: item.id)
            items.removeAll { $0.id == item.id }
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct WishlistView: View {
    @StateObject private var viewModel = WishlistViewModel()
    @State private var showingAddSheet = false
    @State private var editingItem: WishlistItem?

    // Group items: named groups sorted alphabetically, ungrouped last
    private var groupedItems: [(String, [WishlistItem])] {
        var groups: [String: [WishlistItem]] = [:]
        for item in viewModel.items {
            let key = item.group?.trimmingCharacters(in: .whitespaces).isEmpty == false
                ? item.group!.trimmingCharacters(in: .whitespaces)
                : "__other__"
            groups[key, default: []].append(item)
        }
        let namedKeys = groups.keys.filter { $0 != "__other__" }.sorted()
        var result: [(String, [WishlistItem])] = namedKeys.map { key in
            (key, groups[key]!.sorted { lhs, rhs in
                if lhs.priority != rhs.priority { return lhs.priority < rhs.priority }
                return lhs.name < rhs.name
            })
        }
        if let other = groups["__other__"] {
            let sorted = other.sorted { lhs, rhs in
                if lhs.priority != rhs.priority { return lhs.priority < rhs.priority }
                return lhs.name < rhs.name
            }
            result.append(("Other", sorted))
        }
        return result
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.items.isEmpty {
                ProgressView("Loading wishlist...")
            } else if let error = viewModel.error {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.orange)
                    Text("Error loading wishlist")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button("Retry") {
                        Task { await viewModel.load() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            } else if viewModel.items.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "star.slash")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                    Text("Wishlist is Empty")
                        .font(.headline)
                    Text("Tap + to add devices you want to acquire.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
            } else {
                List {
                    ForEach(groupedItems, id: \.0) { groupName, items in
                        Section(header: Text(groupName)) {
                            ForEach(items) { item in
                                WishlistRowView(item: item)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        editingItem = item
                                    }
                                    .swipeActions(edge: .trailing) {
                                        Button(role: .destructive) {
                                            Task { await viewModel.delete(item: item) }
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    }
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Wishlist")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showingAddSheet = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .refreshable {
            await viewModel.load()
        }
        .task {
            await viewModel.load()
        }
        .sheet(isPresented: $showingAddSheet) {
            AddEditWishlistItemView(categories: viewModel.categories, existingGroups: viewModel.existingGroups) {
                Task { await viewModel.load() }
            }
        }
        .sheet(item: $editingItem) { item in
            AddEditWishlistItemView(item: item, categories: viewModel.categories, existingGroups: viewModel.existingGroups) {
                Task { await viewModel.load() }
            }
        }
    }
}

struct WishlistRowView: View {
    let item: WishlistItem

    private var priorityColor: Color {
        switch item.priority {
        case 1: return .red
        case 3: return .gray
        default: return .orange
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Circle()
                    .fill(priorityColor)
                    .frame(width: 8, height: 8)
                Text(item.name)
                    .font(.headline)
                    .lineLimit(1)
                Spacer()
                if let price = item.targetPrice {
                    Text(String(format: "$%.2f", price))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            if item.manufacturer != nil || item.modelNumber != nil {
                Text([item.manufacturer, item.modelNumber].compactMap { $0 }.joined(separator: " · ")
                    + (item.releaseYear.map { " (\($0))" } ?? ""))
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            if let category = item.category {
                Text(category.name)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    NavigationStack {
        WishlistView()
            .environmentObject(AppSettings.shared)
            .environmentObject(AuthService.shared)
    }
}
