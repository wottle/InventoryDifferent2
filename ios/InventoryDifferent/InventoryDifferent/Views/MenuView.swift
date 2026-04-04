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
    @EnvironmentObject var lm: LocalizationManager
    @State private var showingDisconnectAlert = false
    @State private var showingLogoutAlert = false

    var body: some View {
        let t = lm.t
        VStack(spacing: 0) {
            // Only show Financials if authenticated
            if authService.isAuthenticated {
                MenuButton(
                    icon: "star",
                    title: t.menu.wishlist,
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
                    title: t.menu.financials,
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
                    title: t.menu.stats,
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
                    title: t.menu.timeline,
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
                    title: t.menu.chat,
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
                    title: t.menu.logOut,
                    color: .orange
                ) {
                    showingLogoutAlert = true
                }

            } else if !authService.isAuthenticated {
                MenuButton(
                    icon: "person.badge.plus",
                    title: t.menu.logIn,
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
        .alert(t.menu.logOutTitle, isPresented: $showingLogoutAlert) {
            Button(t.common.cancel, role: .cancel) { }
            Button(t.menu.logOut, role: .destructive) {
                authService.logout()
                showingMenu = false
            }
        } message: {
            Text(t.menu.logOutMessage)
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
