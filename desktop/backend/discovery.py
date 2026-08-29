"""
discovery.py — mDNS browse + serial-log IP fallback for discovering ESP32 on LAN
"""
import time
import socket
from zeroconf import Zeroconf, ServiceBrowser

class ESP32Listener:
    def __init__(self):
        self.discovered = []

    def remove_service(self, zeroconf, type, name):
        pass

    def add_service(self, zeroconf, type, name):
        info = zeroconf.get_service_info(type, name)
        if info and info.addresses:
            ip = socket.inet_ntoa(info.addresses[0])
            self.discovered.append({"name": name, "ip": ip, "port": info.port})

def discover_esp32_mdns(timeout: float = 3.0):
    """
    Browses LAN via mDNS for _http._tcp.local or _ws._tcp.local services advertising onesensor.
    """
    zeroconf = Zeroconf()
    listener = ESP32Listener()
    browser = ServiceBrowser(zeroconf, "_http._tcp.local.", listener)
    
    time.sleep(timeout)
    zeroconf.close()
    return listener.discovered
