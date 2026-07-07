import Foundation
import SerialDecoderLib

let args = CommandLine.arguments.dropFirst()

if args.isEmpty || args.contains("--help") || args.contains("-h") {
    print("""
    Usage:
      SerialDecoderCLI <serial>           Human-readable decode
      SerialDecoderCLI --json <serial>    JSON output
      SerialDecoderCLI --test             Run all built-in test cases

    Examples:
      SerialDecoderCLI F9472LNB02
      SerialDecoderCLI --json SG303054C2C
    """)
    exit(0)
}

if args.first == "--test" {
    runTests()
    exit(0)
}

let useJSON = args.first == "--json"
let serial = useJSON ? String(args.dropFirst().first ?? "") : String(args.first ?? "")

if serial.isEmpty {
    fputs("Error: no serial number provided.\n", stderr)
    exit(1)
}

let result = AppleSerialDecoder.decode(serial)

if useJSON {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    if let data = try? encoder.encode(result),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
} else {
    printHuman(result)
}

// MARK: - Human-readable output

func printHuman(_ result: SerialDecodeResult) {
    switch result {
    case .vintage(let r):
        print("Format      : Vintage (pre-1989 style)")
        print("Serial      : \(r.serial)")
        print("Factory     : \(r.factoryCode)\(r.factory.map { " — \($0)" } ?? " — unknown")")
        print("Year        : \(r.year) (digit '\(r.yearDigit)')")
        print("Week        : \(r.week)")
        print("Production  : \(r.productionCode) (base-34 = \(r.productionNumber))")
        print("Model code  : \(r.modelCode)")
        print("Model name  : \(r.modelName ?? "unknown (not in lookup table)")")
        if !r.warnings.isEmpty {
            print("\nWarnings:")
            r.warnings.forEach { print("  ⚠️  \($0)") }
        }

    case .modern(let r):
        print("Format      : \(r.format)")
        print("Serial      : \(r.serial)")
        print("Factory     : \(r.factoryCode)")
        print("Config code : \(r.configCode)")
        print("Model ID    : \(r.modelIdentifier ?? "unknown")")
        print("Model name  : \(r.modelName ?? "unknown (not in lookup table)")")
        if !r.warnings.isEmpty {
            print("\nWarnings:")
            r.warnings.forEach { print("  ⚠️  \($0)") }
        }

    case .unknown(let msg):
        print("Unknown format: \(msg)")

    case .error(let msg):
        print("Error: \(msg)")
    }
}

// MARK: - Test suite

struct TestCase {
    let serial: String
    let expectedFormat: String         // "vintage" | "modern" | "error"
    let expectedModelCode: String?
    let expectedModelName: String?
    let expectsWarning: Bool
    let note: String
}

func runTests() {
    let tests: [TestCase] = [
        // --- Vintage: confirmed from real inventory ---
        TestCase(serial: "F9472LNB02",    expectedFormat: "vintage", expectedModelCode: "B02",     expectedModelName: "Macintosh SE FDHD",       expectsWarning: true,  note: "Mac SE FDHD — spec example"),
        TestCase(serial: "F441604M0001",  expectedFormat: "vintage", expectedModelCode: "M0001",   expectedModelName: "Macintosh 128K",           expectsWarning: false, note: "Mac 512k (Joel) — 1984"),
        TestCase(serial: "F445FM3M0001",  expectedFormat: "vintage", expectedModelCode: "M0001",   expectedModelName: "Macintosh 128K",           expectsWarning: false, note: "Mac 128k FatMac — 1984"),
        TestCase(serial: "F64423SM0001E", expectedFormat: "vintage", expectedModelCode: "M0001E",  expectedModelName: nil,                        expectsWarning: false, note: "Mac 512k recapped — unknown variant"),
        TestCase(serial: "F846FHRM0001A", expectedFormat: "vintage", expectedModelCode: "M0001A",  expectedModelName: "Macintosh Plus",           expectsWarning: false, note: "Mac Plus Platinum — 1988"),
        TestCase(serial: "F7385QDM5010",  expectedFormat: "vintage", expectedModelCode: "M5010",   expectedModelName: "Macintosh SE",             expectsWarning: false, note: "Mac SE — 1987"),
        TestCase(serial: "F7180Y9M5011",  expectedFormat: "vintage", expectedModelCode: "M5011",   expectedModelName: "Macintosh SE FDHD",        expectsWarning: false, note: "Mac SE Arthur — 1987"),
        TestCase(serial: "F8050NGM5030",  expectedFormat: "vintage", expectedModelCode: "M5030",   expectedModelName: "Macintosh II",             expectsWarning: false, note: "Mac II recapped — 1988"),
        TestCase(serial: "F8406YNM5030",  expectedFormat: "vintage", expectedModelCode: "M5030",   expectedModelName: "Macintosh II",             expectsWarning: false, note: "Mac II BlueSCSI — 1988"),
        TestCase(serial: "F9058ECM5119",  expectedFormat: "vintage", expectedModelCode: "M5119",   expectedModelName: "Macintosh SE/30",          expectsWarning: true,  note: "Mac SE/30 — 1989"),
        TestCase(serial: "E9460MBM5392",  expectedFormat: "vintage", expectedModelCode: "M5392",   expectedModelName: "Macintosh SE/30",          expectsWarning: true,  note: "Mac SE/30 — unknown E factory"),
        TestCase(serial: "F9231K8K02",    expectedFormat: "vintage", expectedModelCode: "K02",     expectedModelName: "Macintosh SE/30",          expectsWarning: true,  note: "Mac SE/30 — 1989"),
        TestCase(serial: "F929F9KK02",    expectedFormat: "vintage", expectedModelCode: "K02",     expectedModelName: "Macintosh SE/30",          expectsWarning: true,  note: "Mac SE/30 Wesley — 1989"),
        TestCase(serial: "F943F2VK01",    expectedFormat: "vintage", expectedModelCode: "K01",     expectedModelName: "Macintosh SE/30",          expectsWarning: true,  note: "Mac SE/30 Beck — 1989"),
        TestCase(serial: "E838G8CA2S6000",expectedFormat: "vintage", expectedModelCode: "A2S6000", expectedModelName: "Apple IIgs (ROM 01)",      expectsWarning: false, note: "Apple IIgs — product# = model code"),
        TestCase(serial: "F4381C3M0001",  expectedFormat: "vintage", expectedModelCode: "M0001",   expectedModelName: "Macintosh 128K",           expectsWarning: false, note: "Spec example"),
        TestCase(serial: "CK5221KAM0001W",expectedFormat: "vintage", expectedModelCode: "M0001W",  expectedModelName: "Macintosh 512K",           expectsWarning: false, note: "CK two-char factory"),
        TestCase(serial: "F3047M1DM59",   expectedFormat: "vintage", expectedModelCode: "DM59",    expectedModelName: "Macintosh Portable",       expectsWarning: false, note: "Mac Portable non-backlit"),
        TestCase(serial: "F3204X511P",    expectedFormat: "vintage", expectedModelCode: "11P",     expectedModelName: "PowerBook Duo 270c",       expectsWarning: false, note: "PowerBook Duo 270c"),
        TestCase(serial: "F5204AB4ZP",    expectedFormat: "vintage", expectedModelCode: "4ZP",     expectedModelName: "PowerBook 190cs",          expectsWarning: false, note: "PowerBook 190cs"),
        TestCase(serial: "F3140KN15E",    expectedFormat: "vintage", expectedModelCode: "15E",     expectedModelName: "PowerBook 165",            expectsWarning: false, note: "PowerBook 165"),
        // Normalization test
        TestCase(serial: "f438-1c3-m0001",expectedFormat: "vintage", expectedModelCode: "M0001",   expectedModelName: "Macintosh 128K",           expectsWarning: false, note: "Lowercase + dashes — should normalize"),

        // --- Modern: should route to modern decoder ---
        TestCase(serial: "SG303054C2C",   expectedFormat: "modern",  expectedModelCode: nil,       expectedModelName: nil,                        expectsWarning: false, note: "Color Classic — 11-char modern (SG factory)"),
        TestCase(serial: "XB3296HGCA8",   expectedFormat: "modern",  expectedModelCode: nil,       expectedModelName: nil,                        expectsWarning: false, note: "Quadra 650 — 11-char modern"),
        TestCase(serial: "SG6426D18KS",   expectedFormat: "modern",  expectedModelCode: nil,       expectedModelName: "Performa 5440",            expectsWarning: false, note: "Performa 5440 — 11-char modern (SG factory)"),
        TestCase(serial: "SYM9363YW9G6",  expectedFormat: "modern",  expectedModelCode: nil,       expectedModelName: nil,                        expectsWarning: false, note: "Mac Mini 2009 — 12-char modern"),
        TestCase(serial: "F5KRT08HF9VN",  expectedFormat: "modern",  expectedModelCode: nil,       expectedModelName: "Mac Pro (Late 2013)",      expectsWarning: false, note: "Mac Pro 2013 — 12-char modern"),

        // --- Edge / rejection ---
        TestCase(serial: "F4381C3",       expectedFormat: "error",   expectedModelCode: nil,       expectedModelName: nil,                        expectsWarning: false, note: "Too short"),
    ]

    var passed = 0
    var failed = 0

    for test in tests {
        let result = AppleSerialDecoder.decode(test.serial)
        var ok = true
        var issues: [String] = []

        switch result {
        case .vintage(let r):
            if test.expectedFormat != "vintage" { issues.append("format: expected \(test.expectedFormat), got vintage") }
            if let ec = test.expectedModelCode, r.modelCode != ec {
                issues.append("model_code: expected '\(ec)', got '\(r.modelCode)'")
            }
            if let en = test.expectedModelName, r.modelName != en {
                issues.append("model_name: expected '\(en)', got '\(r.modelName ?? "nil")'")
            }
            if test.expectsWarning && r.warnings.isEmpty {
                issues.append("expected at least one warning, got none")
            }
        case .modern(let r):
            if test.expectedFormat != "modern" { issues.append("format: expected \(test.expectedFormat), got modern") }
            if let en = test.expectedModelName, r.modelName != en {
                issues.append("model_name: expected '\(en)', got '\(r.modelName ?? "nil")'")
            }
        case .error:
            if test.expectedFormat != "error" { issues.append("format: expected \(test.expectedFormat), got error") }
        case .unknown(let msg):
            if test.expectedFormat != "error" && test.expectedFormat != "unknown" {
                issues.append("format: expected \(test.expectedFormat), got unknown: \(msg)")
            }
        }

        ok = issues.isEmpty
        if ok {
            print("  ✅ \(test.serial.padding(toLength: 20, withPad: " ", startingAt: 0)) \(test.note)")
            passed += 1
        } else {
            print("  ❌ \(test.serial.padding(toLength: 20, withPad: " ", startingAt: 0)) \(test.note)")
            issues.forEach { print("       → \($0)") }
            failed += 1
        }
    }

    print("\n\(passed) passed, \(failed) failed out of \(tests.count) tests.")
    if failed > 0 { exit(1) }
}
