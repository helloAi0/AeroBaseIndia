INSERT INTO roles(id,name,description) VALUES (gen_random_uuid(),'PASSENGER','Passenger self-service')
ON CONFLICT (name) DO NOTHING;
