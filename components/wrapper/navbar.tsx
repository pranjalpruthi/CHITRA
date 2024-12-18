"use client"

import ModeToggle from '@/components/mode-toggle'
import { UserProfile } from '@/components/user-profile'
import config from '@/config'
import { ChevronRight, HomeIcon, Info, BookOpen, FileText } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { ShinyRotatingBorderButton } from "@/components/ui/shiny-rotating-border-button"
import { AboutSheet } from "@/components/chromoviz/about"
import { GuideSheet } from "@/components/chromoviz/guide"
import { Button } from "@/components/ui/button"
import { ShareDrawer } from "@/components/share-drawer"

function Breadcrumbs() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)
  
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-50">
        <HomeIcon className="h-4 w-4" />
      </Link>
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join('/')}`
        const isLast = index === paths.length - 1
        
        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link
              href={href}
              className={clsx(
                "capitalize hover:text-gray-900 dark:hover:text-gray-50",
                { "text-gray-900 dark:text-gray-50": isLast }
              )}
            >
              {path}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 10)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[60px]">
      <header 
        className={clsx(
          "w-full transition-all duration-200 h-full relative",
          isHomePage ? [
            "max-w-2xl mx-auto mt-4",
            isScrolled 
              ? "bg-background/40 backdrop-blur-[16px] brightness-[1.1] border border-white/[0.1] dark:border-white/[0.05] rounded-full"
              : "bg-background/30 backdrop-blur-[16px] rounded-full"
          ] : [
            isScrolled 
              ? "bg-background/40 backdrop-blur-[16px] brightness-[1.1] border-b border-white/[0.1] dark:border-white/[0.05]"
              : "bg-background/30 backdrop-blur-[16px]"
          ]
        )}
      >
        {/* Add bottom glass edge */}
        <div className={clsx(
          "absolute inset-x-0 -bottom-[1px] h-[1px]",
          "bg-gradient-to-r from-transparent via-white/[0.15] to-transparent",
          "backdrop-blur-[8px]",
          isHomePage && "rounded-full"
        )} />

        <div className={clsx(
          "flex h-14 lg:h-[55px] items-center justify-between px-4 md:px-6 lg:px-8",
          isHomePage && "px-6"
        )}>
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <ShinyRotatingBorderButton className={clsx(
                "!p-1.5 !px-3",
                isHomePage && "!border-0"
              )}>
                <span className="text-sm font-bold tracking-tight">CHITRA</span>
              </ShinyRotatingBorderButton>
            </Link>
            <div className="flex items-center gap-2">
              <AboutSheet>
                <Button 
                  variant="ghost" 
                  className="h-8 hover:bg-background/80 text-sm"
                >
                  <Info className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">About</span>
                </Button>
              </AboutSheet>
              <GuideSheet>
                <Button 
                  variant="ghost" 
                  className="h-8 hover:bg-background/80 text-sm"
                >
                  <BookOpen className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Guide</span>
                </Button>
              </GuideSheet>
              <Link href="/docs">
                <Button 
                  variant="ghost" 
                  className="h-8 hover:bg-background/80 text-sm"
                >
                  <FileText className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Docs</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side content */}
          <div className="flex items-center gap-4">
            <div className={clsx(
              "hidden md:block",
              isHomePage && "hidden"
            )}>
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2">
              {config?.auth?.enabled && (
                <div className="hidden md:block">
                  <UserProfile />
                </div>
              )}
              <div className="hidden md:block">
                <ShareDrawer />
              </div>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}
