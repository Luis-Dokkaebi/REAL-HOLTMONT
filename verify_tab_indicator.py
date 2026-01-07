import os

def verify():
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    print("Verifying CSS...")
    if ".tab-indicator" in content and "background-color: var(--accent);" in content:
        print("CSS Verification PASSED")
    else:
        print("CSS Verification FAILED")

    print("Verifying HTML...")
    # Check for the indicator div
    if '<div class="tab-indicator" ref="tabIndicator"></div>' in content:
        print("HTML Indicator Verification PASSED")
    else:
        print("HTML Indicator Verification FAILED: Indicator div not found")

    # Check for the VENTAS tab and refs
    if 'ref="tabVentas"' in content and 'switchTrackerTab(\'VENTAS\', $event)' in content:
        print("HTML Tab Refs Verification PASSED")
    else:
        print("HTML Tab Refs Verification FAILED")

    print("Verifying JS...")
    if "anime({" in content and "easing: 'spring(1, 80, 10, 0)'" in content:
        print("JS Animation Logic Verification PASSED")
    else:
        print("JS Animation Logic Verification FAILED")

    if "const moveIndicator = (target) =>" in content:
         print("JS Function Verification PASSED")
    else:
         print("JS Function Verification FAILED")

    if "tabIndicator, tabOperativo, tabVentas" in content:
        print("JS Return Verification PASSED")
    else:
        print("JS Return Verification FAILED")

if __name__ == "__main__":
    verify()
