import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { insertUserSchema, loginUserSchema, insertEventSchema, updateEventSchema, updateUserSchema, changePasswordSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Express.Request {
  userId?: string;
}

// Authentication middleware
const authenticateToken = (req: AuthRequest, res: Express.Response, next: Express.NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      const { password, ...userProfile } = user;
      res.json({ user: userProfile, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update online status
      await storage.updateUserOnlineStatus(user.id, true);
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      const { password: _, ...userProfile } = user;
      
      res.json({ user: { ...userProfile, isOnline: true }, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.userId) {
        await storage.updateUserOnlineStatus(req.userId, false);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserProfile(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(req.userId!, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/me/password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(req.userId!, hashedNewPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { category, search, date, location } = req.query;
      const filters = {
        category: category as string,
        search: search as string,
        date: date as string,
        location: location as string,
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const events = await storage.getEvents(filters);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({ ...eventData, organizerId: req.userId! });
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/events/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = updateEventSchema.parse(req.body);
      const event = await storage.updateEvent(req.params.id, updates, req.userId!);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found or unauthorized" });
      }
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/events/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id, req.userId!);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found or unauthorized" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/me/events", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const events = await storage.getEventsByOrganizer(req.userId!);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Event attendance routes
  app.post("/api/events/:id/join", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await storage.joinEvent(req.params.id, req.userId!);
      
      if (!success) {
        return res.status(400).json({ message: "Unable to join event (may be full or inactive)" });
      }
      
      res.json({ message: "Successfully joined event" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events/:id/leave", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await storage.leaveEvent(req.params.id, req.userId!);
      
      if (!success) {
        return res.status(400).json({ message: "You are not attending this event" });
      }
      
      res.json({ message: "Successfully left event" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:id/attendance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const isAttending = await storage.isUserAttending(req.params.id, req.userId!);
      res.json({ isAttending });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
