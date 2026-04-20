//
//  DeviceGridItemView.swift
//  InventoryDifferent
//

import SwiftUI

private extension Color {
    // International Blue — matches edPrimary in DeviceDetailViewRedesign
    static let edPrimary = Color(red: 0, green: 88 / 255, blue: 188 / 255)
}

struct DeviceGridItemView: View {
    let device: DeviceListItem
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Thumbnail area
            ZStack(alignment: .topLeading) {
                CachedThumbnailImage(url: thumbnailURL)
                    .aspectRatio(1, contentMode: .fill)
                    .clipped()

                // Favorite star — top left
                if device.isFavorite {
                    Image(systemName: "star.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.yellow)
                        .shadow(color: .black.opacity(0.4), radius: 2, x: 0, y: 1)
                        .padding(6)
                }

                // Status badge — top right
                StatusBadge(status: device.status)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(6)
            }
            .overlay(alignment: .bottom) {
                // Status indicator icons — centered along the bottom of the thumbnail
                StatusIndicatorsRow(device: device)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background((colorScheme == .dark ? Color.black : Color.white).opacity(0.82))
                    .clipShape(Capsule())
                    .padding(.bottom, 6)
            }

            // Text area
            VStack(alignment: .leading, spacing: 2) {
                Text(cardOverline)
                    .font(.system(size: 9, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(1.2)
                    .foregroundColor(.edPrimary)
                    .lineLimit(1)

                Text(device.name)
                    .font(.system(size: 12, weight: .bold))
                    .tracking(-0.2)
                    .lineLimit(1)

                Text(device.additionalName?.isEmpty == false ? device.additionalName! : device.manufacturer ?? device.category.name)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.secondary)
                    .lineLimit(1)

                ValueSaleInfo(device: device)
                    .font(.system(size: 10, weight: .semibold))
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
        }
        .background(Color(.systemGray5))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }

    private var cardOverline: String {
        var parts = [device.category.name]
        if let year = device.releaseYear { parts.append(String(year)) }
        return parts.joined(separator: " · ")
    }

    private var thumbnailURL: URL? {
        guard let thumbnail = device.thumbnailImage(for: colorScheme) else { return nil }
        let path = thumbnail.thumbnailPath ?? thumbnail.path
        return APIService.shared.imageURL(for: path)
    }
}
