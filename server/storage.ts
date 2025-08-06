import { type User, type InsertUser, type LoginUser, type UserProfile, type UpdateUser, type ChangePassword, type Event, type InsertEvent, type UpdateEvent, type EventWithDetails, type Category, type InsertCategory, type EventAttendee } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<boolean>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  verifyPassword(email: string, password: string): Promise<User | undefined>;

  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  // Event methods
  getEvents(filters?: { category?: string; search?: string; date?: string; location?: string }): Promise<EventWithDetails[]>;
  getEvent(id: string): Promise<EventWithDetails | undefined>;
  getEventsByOrganizer(organizerId: string): Promise<EventWithDetails[]>;
  createEvent(event: InsertEvent & { organizerId: string }): Promise<Event>;
  updateEvent(id: string, updates: UpdateEvent, organizerId: string): Promise<Event | undefined>;
  deleteEvent(id: string, organizerId: string): Promise<boolean>;
  
  // Event attendance methods
  joinEvent(eventId: string, userId: string): Promise<boolean>;
  leaveEvent(eventId: string, userId: string): Promise<boolean>;
  isUserAttending(eventId: string, userId: string): Promise<boolean>;
  getEventAttendees(eventId: string): Promise<User[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private events: Map<string, Event>;
  private eventAttendees: Map<string, EventAttendee>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.events = new Map();
    this.eventAttendees = new Map();
    this.seedData();
  }

  private async seedData() {
    // Seed categories
    const defaultCategories: InsertCategory[] = [
      { name: "Music", slug: "music", color: "purple" },
      { name: "Sports", slug: "sports", color: "orange" },
      { name: "Food & Drink", slug: "food-drink", color: "green" },
      { name: "Arts", slug: "arts", color: "pink" },
      { name: "Community", slug: "community", color: "blue" },
      { name: "Business", slug: "business", color: "gray" },
    ];

    for (const category of defaultCategories) {
      await this.createCategory(category);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const { password, ...profile } = user;
    return profile;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.password = hashedPassword;
    this.users.set(id, user);
    return true;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  async verifyPassword(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : undefined;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async getEvents(filters?: { category?: string; search?: string; date?: string; location?: string }): Promise<EventWithDetails[]> {
    let events = Array.from(this.events.values()).filter(event => event.isActive);
    
    if (filters?.category) {
      const category = await this.getCategoryBySlug(filters.category);
      if (category) {
        events = events.filter(event => event.categoryId === category.id);
      }
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      events = events.filter(event => 
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.location.toLowerCase().includes(search)
      );
    }
    
    if (filters?.location) {
      events = events.filter(event => 
        event.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }
    
    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Populate with category and organizer data
    const eventsWithDetails: EventWithDetails[] = [];
    for (const event of events) {
      const category = this.categories.get(event.categoryId);
      const organizer = this.users.get(event.organizerId);
      if (category && organizer) {
        const { password, ...organizerProfile } = organizer;
        eventsWithDetails.push({
          ...event,
          category,
          organizer: organizerProfile as User,
          spotsLeft: event.maxAttendees ? event.maxAttendees - event.currentAttendees : undefined,
        });
      }
    }
    
    return eventsWithDetails;
  }

  async getEvent(id: string): Promise<EventWithDetails | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const category = this.categories.get(event.categoryId);
    const organizer = this.users.get(event.organizerId);
    
    if (!category || !organizer) return undefined;
    
    const { password, ...organizerProfile } = organizer;
    return {
      ...event,
      category,
      organizer: organizerProfile as User,
      spotsLeft: event.maxAttendees ? event.maxAttendees - event.currentAttendees : undefined,
    };
  }

  async getEventsByOrganizer(organizerId: string): Promise<EventWithDetails[]> {
    const events = Array.from(this.events.values()).filter(event => event.organizerId === organizerId);
    const eventsWithDetails: EventWithDetails[] = [];
    
    for (const event of events) {
      const category = this.categories.get(event.categoryId);
      const organizer = this.users.get(event.organizerId);
      if (category && organizer) {
        const { password, ...organizerProfile } = organizer;
        eventsWithDetails.push({
          ...event,
          category,
          organizer: organizerProfile as User,
          spotsLeft: event.maxAttendees ? event.maxAttendees - event.currentAttendees : undefined,
        });
      }
    }
    
    return eventsWithDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createEvent(eventData: InsertEvent & { organizerId: string }): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      ...eventData,
      id,
      currentAttendees: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updates: UpdateEvent, organizerId: string): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event || event.organizerId !== organizerId) return undefined;
    
    const updatedEvent = { ...event, ...updates, updatedAt: new Date() };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string, organizerId: string): Promise<boolean> {
    const event = this.events.get(id);
    if (!event || event.organizerId !== organizerId) return false;
    
    // Soft delete
    event.isActive = false;
    this.events.set(id, event);
    return true;
  }

  async joinEvent(eventId: string, userId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event || !event.isActive) return false;
    
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return false; // Event is full
    }
    
    const attendeeId = randomUUID();
    const attendee: EventAttendee = {
      id: attendeeId,
      eventId,
      userId,
      joinedAt: new Date(),
    };
    
    this.eventAttendees.set(attendeeId, attendee);
    event.currentAttendees = event.currentAttendees + 1;
    this.events.set(eventId, event);
    
    return true;
  }

  async leaveEvent(eventId: string, userId: string): Promise<boolean> {
    const attendee = Array.from(this.eventAttendees.values())
      .find(a => a.eventId === eventId && a.userId === userId);
    
    if (!attendee) return false;
    
    this.eventAttendees.delete(attendee.id);
    
    const event = this.events.get(eventId);
    if (event) {
      event.currentAttendees = Math.max(0, event.currentAttendees - 1);
      this.events.set(eventId, event);
    }
    
    return true;
  }

  async isUserAttending(eventId: string, userId: string): Promise<boolean> {
    return Array.from(this.eventAttendees.values())
      .some(a => a.eventId === eventId && a.userId === userId);
  }

  async getEventAttendees(eventId: string): Promise<User[]> {
    const attendeeIds = Array.from(this.eventAttendees.values())
      .filter(a => a.eventId === eventId)
      .map(a => a.userId);
    
    const attendees: User[] = [];
    for (const id of attendeeIds) {
      const user = this.users.get(id);
      if (user) {
        const { password, ...userProfile } = user;
        attendees.push(userProfile as User);
      }
    }
    
    return attendees;
  }
}

export const storage = new MemStorage();
