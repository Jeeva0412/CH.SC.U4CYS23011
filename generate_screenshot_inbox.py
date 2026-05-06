import matplotlib.pyplot as plt
import pandas as pd
import json

# Output from priority_inbox
data = [
    {"ID": "1739f1a3-c42d-4c48-9773-5a20dd269f19", "Type": "Placement", "Message": "Booking Holdings Inc. hiring", "Timestamp": "2026-05-06 08:28:01"},
    {"ID": "4986398b-6658-4583-b497-79e1dd116ec1", "Type": "Placement", "Message": "CSX Corporation hiring", "Timestamp": "2026-05-06 03:27:29"},
    {"ID": "80eb6080-ee83-41b8-a9c2-ba21800bbd7e", "Type": "Placement", "Message": "Meta Platforms Inc. hiring", "Timestamp": "2026-05-05 16:57:37"},
    {"ID": "53cdf127-fe35-4305-a0c5-295e928e87eb", "Type": "Placement", "Message": "Marriott International Inc. hiring", "Timestamp": "2026-05-05 12:27:25"},
    {"ID": "37104f99-4e39-46ec-a52d-c9eba3c72187", "Type": "Result", "Message": "internal", "Timestamp": "2026-05-06 01:27:53"},
    {"ID": "2579ea04-bb70-4118-b8f9-42179dc81825", "Type": "Result", "Message": "internal", "Timestamp": "2026-05-05 23:28:13"},
    {"ID": "a300e344-94ae-46ce-92cc-145c1434e2ee", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-05-05 22:28:09"},
    {"ID": "2bce683b-097a-4028-b7b0-da2e88449b0b", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-05-05 19:28:05"},
    {"ID": "75f12357-1f5c-444e-beb3-1125effdf2ae", "Type": "Result", "Message": "internal", "Timestamp": "2026-05-05 16:57:09"},
    {"ID": "e80bd69f-616f-46af-9e08-d6f3a5e9db49", "Type": "Result", "Message": "internal", "Timestamp": "2026-05-05 16:28:17"}
]

df = pd.DataFrame(data)

fig, ax = plt.subplots(figsize=(12, 4))
ax.axis('tight')
ax.axis('off')
table = ax.table(cellText=df.values, colLabels=df.columns, loc='center', cellLoc='left')
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 1.2)

plt.title('Top 10 Priority Notifications')
plt.savefig('priority_inbox_screenshot.png', bbox_inches='tight', dpi=300)
print('Saved priority_inbox_screenshot.png')
