import wifi_scanner

def main():
    scanner = wifi_scanner.MacOSWiFiScanner()
    print(scanner.get_wifi_info())

if __name__ == "__main__":
    main()

