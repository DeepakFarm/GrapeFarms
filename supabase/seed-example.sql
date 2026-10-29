-- Optional sample setup after you have created a farm from the app.
-- Replace YOUR_FARM_UUID with your farm ID.
-- Do not run this until a farm exists.
insert into public.plots (farm_id, name, crop_name, area, area_unit, notes) values
('YOUR_FARM_UUID','Plot A','Tomato',1.5,'acre','Example only'),
('YOUR_FARM_UUID','Plot B','Chilli',0.75,'acre','Example only');

insert into public.inventory_items (farm_id, category, name, brand, unit, low_stock_threshold, notes) values
('YOUR_FARM_UUID','pesticide','Example spray product','Example brand','ml',500,'Replace with actual product'),
('YOUR_FARM_UUID','fertilizer','Example water-soluble fertilizer','Example brand','kg',5,'Replace with actual product');
