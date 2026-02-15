/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'media',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Retro Apple Platinum palette (Mac OS 8/9 era)
                platinum: {
                    50: '#fafafa',
                    100: '#f0f0f0',
                    200: '#e4e4e4',
                    300: '#d1d1d1',
                    400: '#b4b4b4',
                    500: '#9a9a9a',
                    600: '#818181',
                    700: '#6a6a6a',
                    800: '#5a5a5a',
                    900: '#3d3d3d',
                },
                // Classic Apple rainbow colors
                apple: {
                    green: '#5EBD3E',
                    yellow: '#FFB900',
                    orange: '#F78200',
                    red: '#E23838',
                    purple: '#973999',
                    blue: '#009CDF',
                },
                // System accent colors
                'system-blue': '#0066CC',
                'system-highlight': '#3399FF',
            },
            fontFamily: {
                // Chicago-inspired system font stack
                'system': ['"SF Pro Display"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
                'mono': ['"SF Mono"', 'Monaco', '"Courier New"', 'monospace'],
            },
            boxShadow: {
                // Classic Mac OS beveled effects
                'bevel': 'inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff',
                'bevel-pressed': 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff',
                'window': '0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                'card-retro': '0 1px 0 #ffffff inset, 0 -1px 0 #808080 inset, 1px 0 0 #ffffff inset, -1px 0 0 #808080 inset, 2px 2px 4px rgba(0, 0, 0, 0.1)',
            },
            borderRadius: {
                'retro': '4px',
            },
        },
    },
    plugins: [],
}
