-- Project Alfa - Database Schema

-- Table: clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users (Team members)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: projects
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_type VARCHAR(50) NOT NULL, -- Construction, Consulting, Internal, Tax
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(15, 2) NOT NULL,
    billing_type VARCHAR(50) NOT NULL, -- Fixed, Hourly, Retainer
    progress INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'On Track',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: project_team
CREATE TABLE project_team (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: milestones
CREATE TABLE milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(100), -- Structural, MEP, Tax, General
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data for Dropdowns
INSERT INTO clients (name) VALUES ('Frenchwalk Property'), ('Global Towers Inc'), ('Internal Operations');
INSERT INTO users (name, role) VALUES ('James Miller', 'Site Manager'), ('Sarah Dorsey', 'Project Manager'), ('Michael Chang', 'Senior Engineer');
