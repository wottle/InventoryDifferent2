//
//  MenuView.swift
//  InventoryDifferent
//
//  Created by Michael Wottle on 2/7/26.
//

import SwiftUI

struct MenuView: View {
    @Binding var navigationPath: NavigationPath
    @Binding var showingMenu: Bool
    @EnvironmentObject var appSettings: AppSettings
    @EnvironmentObject var authService: AuthService
    @State private var showingDisconnectAlert = false
    @State private var showingLogoutAlert = false

    var body: some View {
        VStack(spacing: 0) {
            // Only show Financials if authenticated
            if authService.isAuthenticated {
                MenuButton(
                    icon: "star",
                    title: "Wishlist",
                    color: .yellow
                ) {
                    showingMenu = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        navigationPath.append(MenuDestination.wishlist)
                    }
                }

                Divider()
                    .padding(.leading, 44)

                MenuButton(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "Financials",
                    color: .green
                ) {
                    showingMenu = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        navigationPath.append(MenuDestination.financials)
                    }
                }

                Divider()
                    .padding(.leading, 44)


                MenuButton(
                    icon: "chart.bar.xaxis",
                    title: "Stats",
                    color: .purple
                ) {
                    showingMenu = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        navigationPath.append(MenuDestination.stats)
                    }
                }

                Divider()
                    .padding(.leading, 44)

                MenuButton(
                    icon: "clock.arrow.circlepath",
                    title: "Timeline",
                    color: .teal
                ) {
                    showingMenu = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        navigationPath.append(MenuDestination.timeline)
                    }
                }

                Divider()
                    .padding(.leading, 44)

                MenuButton(
                    icon: "bubble.left.and.bubble.right",
                    title: "Chat",
                    color: .blue
                ) {
                    showingMenu = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        navigationPath.append(MenuDestination.chat)
                    }
                }

                Divider()
                    .padding(.leading, 44)


            }

            // Show Log Out if authenticated, or Log In if auth is required but not authenticated
            if authService.isAuthenticated {
                MenuButton(
                    icon: "person.badge.minus",
                    title: "Log Out",
                    color: .orange
                ) {
                    showingLogoutAlert = true
                }

            } else if !authService.isAuthenticated {
                MenuButton(
                    icon: "person.badge.plus",
                    title: "Log In",
                    color: .blue
                ) {
                    showingMenu = false
                    authService.disconnect()
                }

            }

        }
        .padding(.vertical, 8)
        .frame(width: 250)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .shadow(color: Color.black.opacity(0.15), radius: 10, x: 0, y: 5)
        .alert("Log Out?", isPresented: $showingLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Log Out", role: .destructive) {
                authService.logout()
                showingMenu = false
            }
        } message: {
            Text("You will need to enter the password again to access admin features.")
        }
    }
}

struct MenuButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 24)
                    .font(.system(size: 18))
                
                Text(title)
                    .foregroundColor(.primary)
                    .font(.body)
                
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    MenuView(navigationPath: .constant(NavigationPath()), showingMenu: .constant(true))
        .environmentObject(AppSettings())
        .environmentObject(AuthService.shared)
}
