"use client"
import Link from 'next/link';
import { Github, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
    return (
        <footer className="border-t dark:bg-black">
            <div className="mx-auto max-w-screen-xl px-4 py-8 mb-[4.5rem] min-[825px]:mb-8">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                    <div className="col-span-2 sm:col-span-1">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium">About CHITRA</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    CHromosome Interactive Tool for Rearrangement Analysis
                                </p>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/methodology" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Methodology
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="space-y-4">
                            <h3 className="font-medium">Resources</h3>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Example Data
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/api" className="text-muted-foreground hover:text-foreground transition-colors">
                                        API
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="space-y-4">
                            <h3 className="font-medium">Connect</h3>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <a 
                                        href="https://github.com/your-repo/chromoviz" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                                    >
                                        <Github className="h-4 w-4" />
                                        <span>GitHub</span>
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="mailto:support@chromoviz.com" 
                                        className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                                    >
                                        <Mail className="h-4 w-4" />
                                        <span>Contact</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8">
                    <Separator className="mb-8" />
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        <p className="text-xs text-muted-foreground order-2 sm:order-1">
                            &copy; {new Date().getFullYear()} CHITRA. All rights reserved.
                        </p>
                        <ul className="flex flex-wrap gap-4 text-xs order-1 sm:order-2">
                            <li>
                                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Terms
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                                    Privacy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
}
