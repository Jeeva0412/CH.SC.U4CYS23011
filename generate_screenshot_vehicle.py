import matplotlib.pyplot as plt
import pandas as pd

# Depot 4 Data from vehicle_scheduling output
data = [
    {"TaskID": "a8b6cbe4-7f82-4d01-8912-1b07e4cde9b7", "Duration": 1, "Impact": 9},
    {"TaskID": "09d57634-202b-4fc1-b3b5-c65d91452eac", "Duration": 6, "Impact": 10},
    {"TaskID": "a5f85db8-e95e-4e1f-9fb7-34b2140ae846", "Duration": 2, "Impact": 5},
    {"TaskID": "015f5b82-3d76-49ff-8f5c-49984fa9ce3b", "Duration": 7, "Impact": 9},
    {"TaskID": "449ae852-e19c-490a-8cda-679f74ae95bf", "Duration": 1, "Impact": 2},
    {"TaskID": "effdc971-55d7-442a-a361-c2e14e0ffe73", "Duration": 1, "Impact": 5},
    {"TaskID": "231e93ab-bb56-4e6f-88fb-5eec16f6b4a4", "Duration": 3, "Impact": 8},
    {"TaskID": "bf8bd60e-4901-4379-92ef-834a97db75f3", "Duration": 3, "Impact": 9},
    {"TaskID": "d30cea97-7d0f-4e44-be59-13b23a083309", "Duration": 5, "Impact": 5},
    {"TaskID": "885d50fc-97f5-46d5-86f8-bd6b970bdf81", "Duration": 1, "Impact": 8},
    {"TaskID": "4450d1d5-caa0-45e2-9fd6-6b6f5c5b6c97", "Duration": 3, "Impact": 6},
    {"TaskID": "37afcb8b-e501-4577-b4ea-9efb7bb264ce", "Duration": 2, "Impact": 9},
    {"TaskID": "9c2ca935-be36-4195-8993-4fe313e8b35f", "Duration": 6, "Impact": 6},
    {"TaskID": "76c48fe0-7c6c-4ba0-8b94-c8f1b5a3fbc1", "Duration": 1, "Impact": 5},
    {"TaskID": "d408b9ba-aaff-4c1a-88af-74b510ddb297", "Duration": 4, "Impact": 5},
    {"TaskID": "3ddd2145-93e4-455e-81e7-3a470fbc4f6b", "Duration": 3, "Impact": 3},
    {"TaskID": "027a3a1b-3f28-49ea-8ee0-5134151440ab", "Duration": 3, "Impact": 9},
    {"TaskID": "a3cf20bf-11cc-49e0-90c1-e66f820df2aa", "Duration": 2, "Impact": 6},
    {"TaskID": "69287e59-8b3b-42db-84be-479f1aaeeb62", "Duration": 5, "Impact": 8},
    {"TaskID": "bcc3569c-4b61-454e-9a71-5546d4937c15", "Duration": 1, "Impact": 8},
    {"TaskID": "12cb06aa-3650-4226-aada-d99859ebfa4c", "Duration": 6, "Impact": 10},
    {"TaskID": "ce807f24-3e02-4b74-b6d1-61d1e7fa9eee", "Duration": 1, "Impact": 10},
    {"TaskID": "d67a4ed8-6cd1-49fe-a8a7-ac2dfbc1465e", "Duration": 6, "Impact": 6},
    {"TaskID": "ea85822c-741a-4c7e-991b-5be06758fa13", "Duration": 2, "Impact": 3},
    {"TaskID": "14b8cae9-e571-4031-b924-2792b2c5d76c", "Duration": 7, "Impact": 8},
    {"TaskID": "b29701da-aff6-4777-964d-948275842f85", "Duration": 2, "Impact": 6},
    {"TaskID": "53cf2c86-4931-4a7e-8379-e2cb54e41770", "Duration": 3, "Impact": 7},
    {"TaskID": "6ee3bbdb-4515-48ce-b3d8-8fe2346edc70", "Duration": 5, "Impact": 10},
    {"TaskID": "ed10a0e1-3ba0-4249-860b-b8a38105a469", "Duration": 5, "Impact": 5}
]

df = pd.DataFrame(data)

fig, ax = plt.subplots(figsize=(8, 8))
ax.axis('tight')
ax.axis('off')
table = ax.table(cellText=df.values, colLabels=df.columns, loc='center', cellLoc='left')
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 1.2)

plt.title('Vehicle Scheduler - Optimal Schedule (Depot 4)')
plt.text(0, -0.1, "Maximum Impact Score: 200\nTotal Vehicles Selected: 29\nMechanic-Hours Used: 97 / 97", transform=ax.transAxes, fontsize=12)
plt.savefig('vehicle_scheduling/vehicle_scheduling_screenshot.png', bbox_inches='tight', dpi=300)
print('Saved vehicle_scheduling_screenshot.png')
