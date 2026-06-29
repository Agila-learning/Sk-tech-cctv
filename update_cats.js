db.categories.updateOne({name: 'Bullet Cameras'}, {$set: {image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800', isActive: true}}, {upsert: true});
db.categories.updateOne({name: 'Dome Cameras'}, {$set: {image: 'https://images.unsplash.com/photo-1590483734724-383b85ad92e0?auto=format&fit=crop&q=80&w=800', isActive: true}}, {upsert: true});
db.categories.updateOne({name: 'DVR/NVR Units'}, {$set: {image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=800', isActive: true}}, {upsert: true});
db.categories.updateOne({name: 'PTZ Speed Domes'}, {$set: {image: 'https://images.unsplash.com/photo-1521206698660-5e377ff3fd1d?auto=format&fit=crop&q=80&w=800', isActive: true}}, {upsert: true});
db.categories.updateOne({name: 'Security Accessories'}, {$set: {image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', isActive: true}}, {upsert: true});
