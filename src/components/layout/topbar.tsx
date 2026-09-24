"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  Building2,
  UserPlus,
  FileText,
  Phone,
  Target,
  ClipboardList,
  FolderPlus,
  DollarSign,
  ShoppingCart,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"

interface TopbarProps {
  user: {
    firstName: string
    lastName: string
    email: string
    roles: string[]
  }
  onMenuToggle?: () => void
}

const createMenuItems = [
  { label: "New Inquiry", href: "/sales/inquiries/new", icon: Phone },
  { label: "New Customer", href: "/customers/companies/new", icon: Building2 },
  { label: "New Contact", href: "/customers/contacts/new", icon: UserPlus },
  { label: "New Opportunity", href: "/sales/opportunities/new", icon: Target },
  { label: "New Quotation", href: "/commercial/quotations/new", icon: FileText },
  { label: "New Project", href: "/projects/new", icon: FolderPlus },
  { label: "New Invoice", href: "/accounting/invoices/new", icon: DollarSign },
  { label: "New Vendor", href: "/procurement/vendors/new", icon: Truck },
  { label: "New Purchase Request", href: "/procurement/requests/new", icon: ShoppingCart },
]

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`

  return (
    <header className="topbar">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-md hover:bg-secondary cursor-pointer"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="topbar-search relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search companies, contacts, inquiries..."
          className="pl-9 bg-secondary border-transparent focus:bg-card focus:border-input"
        />
      </form>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Create Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {createMenuItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="cursor-pointer">
                  <item.icon className="h-4 w-4 mr-2 opacity-70" />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications" aria-label="Notifications">
            <Bell className="h-4.5 w-4.5" />
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.roles[0]?.replace(/_/g, " ")}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 hidden md:block text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>{user.firstName} {user.lastName}</div>
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2 opacity-70" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
