import g4f
import json
import os
import glob
import sys
import subprocess
from g4f.api import run_api
from g4f.cookies import set_cookies

# Enable debug logging for troubleshooting
g4f.debug.logging = True

# Configuration paths
CONFIG_DIR = os.path.join(os.getcwd(), 'config')
COOKIES_DIR = os.path.join(CONFIG_DIR, 'cookies')

def check_dependencies():
    """Check for optional dependencies required for some providers"""
    required_packages = ['curl_cffi', 'nodriver', 'platformdirs']
    missing = []
    
    print("[System] Checking dependencies...")
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"[Warning] Missing optional dependencies for better provider support: {', '.join(missing)}")
        print(f"[Tip] Run: pip install -U g4f[all]")

def load_cookies():
    """Load cookies from config/cookies directory"""
    if not os.path.exists(COOKIES_DIR):
        os.makedirs(COOKIES_DIR, exist_ok=True)
        print(f"[Config] Created cookies directory at {COOKIES_DIR}")
        print("[Setup] Please place your cookie files (e.g., google.com.json) here.")
        return

    print("[Config] Loading cookies...")
    cookie_files = glob.glob(os.path.join(COOKIES_DIR, '*.json'))
    count = 0
    
    for cookie_file in cookie_files:
        try:
            # Extract domain from filename (e.g., google.com.json -> google.com)
            filename = os.path.basename(cookie_file)
            domain = filename.replace('.json', '')
            
            # Ensure domain starts with dot for google.com if needed, though g4f handles it
            target_domain = domain if domain.startswith('.') else f".{domain}"
            
            with open(cookie_file, 'r') as f:
                cookies = json.load(f)
                
                # Filter out empty values
                valid_cookies = {k: v for k, v in cookies.items() if v}
                
                if valid_cookies:
                    set_cookies(target_domain, valid_cookies)
                    # Also try setting without leading dot to be safe
                    if target_domain.startswith('.'):
                        set_cookies(target_domain[1:], valid_cookies)
                        
                    count += 1
                    print(f"[Config] Loaded {len(valid_cookies)} cookies for {domain}")
                else:
                    print(f"[Warning] Cookie file {filename} contains no valid cookies.")
                    
        except Exception as e:
            print(f"[Error] Failed to load cookie {cookie_file}: {e}")

    if count == 0:
         print("[Setup] No cookies loaded. For Gemini, create 'config/cookies/google.com.json' with:")
         print('         { "__Secure-1PSID": "YOUR_COOKIE_HERE" }')
    else:
        print(f"[Config] Successfully loaded cookies for {count} domains.")

if __name__ == "__main__":
    print("="*50)
    print("🦞 ClawBridge G4F Server")
    print("="*50)
    
    # Check environment
    check_dependencies()
    
    # Load configuration
    load_cookies()
    
    print("[System] G4F Backend starting on port 1338...")
    print("[Info] If Gemini fails, ensure you have Chrome installed or use a different provider.")
    
    # Start the API server
    try:
        run_api(port=1338)
    except Exception as e:
        print(f"[Fatal] Failed to start G4F: {e}")
        sys.exit(1)
