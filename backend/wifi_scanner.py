import logging 
import os 
import re 
import subprocess
from typing import Dict, Any 

logger = logging.getLogger(__name__)

class MacOSWiFiScanner:
    """macOS-specific WiFi scanner for retrieving current connection information"""
    @staticmethod
    def get_wifi_info() -> Dict[str,Any]:
        """
        Get current WiFi information using wdutil on macOS.
        """
        wifi_info = {}
        try: 

            result = subprocess.run(
                ["sudo", "wdutil", "info"],
                capture_output=True,
                text=True, 
                timeout=5
            )

            # Parse the output
            patterns = {
                "SSID": r"SSID\s*:\s*(?:<redacted>|(.+))",
                "RSSI": r"RSSI\s*:\s*(-?\d+)\s*dBm",
                "Noise": r"Noise\s*:\s*(-?\d+)\s*dBm",
                "Channel": r"Channel\s*:\s*([^\n]+)",
                "Tx Rate": r"Tx Rate\s*:\s*([^\n]+)"
            }

            for key, pattern in patterns.items():
                match = re.search(pattern, result.stdout)
                if match:
                    value = match.group(1) if match.group(1) is not None else match.group(0).split(":", 1)[1].strip()
                    if key in ["RSSI", "Noise"]:
                        try:
                            value = int(value)
                        except ValueError:
                            pass 
                    wifi_info[key] = value
        
        except subprocess.TimeoutExpired:
            logger.error("WiFi scanner command timed out")
            raise RuntimeError("Wifi scan command timed out")
        except subprocess.CalledProcessError as e:
            logger.error(f"Error running Wifi scan: {e}")
            raise RuntimeError(f"Command failed: {e}")
        except Exception as ex:
            logger.exception("Unexpected error in Wifi scan")
            raise RuntimeError(f"Wifi scanning error: {ex}")

        if not wifi_info:
            raise RuntimeError("No Wifi information could be retrieved")

        return wifi_info

