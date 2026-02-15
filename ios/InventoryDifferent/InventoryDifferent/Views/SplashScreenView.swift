//
//  SplashScreenView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/3/26.
//

import SwiftUI

struct SplashScreenView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var animateText = false
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    
    private let textSegments: [(text: String, color: String)] = [
        ("Inv", "5EBD3E"),
        ("ent", "FFB900"),
        ("ory", "F78200"),
        ("Dif", "E23838"),
        ("fer", "973999"),
        ("ent", "009CDF")
    ]
    
    var body: some View {
        ZStack {
            // Very light gray in light mode, very dark gray in dark mode
            (colorScheme == .dark ? Color(hex: "1C1C1E") : Color(hex: "F2F2F7"))
                .ignoresSafeArea()
            
            VStack(spacing: 24) {
                // App Logo with scale animation
                Image("AppLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 120, height: 120)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                
                // App Name with Apple colors - animated
                HStack(spacing: 0) {
                    ForEach(Array(textSegments.enumerated()), id: \.offset) { index, segment in
                        Text(segment.text)
                            .foregroundColor(Color(hex: segment.color))
                            .opacity(animateText ? 1 : 0)
                            .offset(y: animateText ? 0 : 20)
                            .animation(
                                .spring(response: 0.5, dampingFraction: 0.7)
                                .delay(Double(index) * 0.08),
                                value: animateText
                            )
                    }
                }
                .font(.system(size: 32, weight: .light))
            }
        }
        .onAppear {
            // Animate logo
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
            
            // Animate text after a short delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                animateText = true
            }
        }
    }
}

// Color extension for hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    SplashScreenView()
}
