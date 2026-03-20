//
//  DeviceGridItemView.swift
//  InventoryDifferent
//

import SwiftUI

struct DeviceGridItemView: View {
    let device: DeviceListItem

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

            // Text area
            VStack(alignment: .leading, spacing: 2) {
                Text(device.name)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)

                Text(device.additionalName?.isEmpty == false ? device.additionalName! : device.manufacturer ?? device.category.name)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)

                ValueSaleInfo(device: device)
                    .font(.caption2)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }

    private var thumbnailURL: URL? {
        guard let thumbnail = device.thumbnailImage else { return nil }
        let path = thumbnail.thumbnailPath ?? thumbnail.path
        return APIService.shared.imageURL(for: path)
    }
}
