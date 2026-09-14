import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-5">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-6 px-8 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">UI Elements Showcase</h1>
          <p className="text-sm text-muted-foreground">
            Standard shadcn/ui components for this project (style: base-nova)
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Section title="Buttons">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </Section>

        <Section title="Badges">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </Section>

        <Section title="Toggle & Toggle Group">
          <Toggle aria-label="Toggle bold">B</Toggle>
          <ToggleGroup defaultValue={["left"]}>
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section title="Button Group">
          <ButtonGroup>
            <Button variant="outline">Left</Button>
            <ButtonGroupSeparator />
            <Button variant="outline">Middle</Button>
            <ButtonGroupSeparator />
            <Button variant="outline">Right</Button>
          </ButtonGroup>
        </Section>

        <Section title="Avatar & Separator">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm">Content beside avatar</span>
        </Section>

        <Section title="Skeleton & Spinner">
          <Skeleton className="h-8 w-24" />
          <Spinner className="size-6" />
        </Section>

        <Section title="Kbd">
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </Section>

        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="outline">Hover me</Button>}
            />
            <TooltipContent>Helpful tooltip text</TooltipContent>
          </Tooltip>
        </Section>

        <Section title="Popover">
          <Popover>
            <PopoverTrigger
              render={<Button variant="outline">Open popover</Button>}
            />
            <PopoverContent>
              <p className="text-sm">Popover content goes here.</p>
            </PopoverContent>
          </Popover>
        </Section>

        <Section title="Hover Card">
          <HoverCard>
            <HoverCardTrigger
              render={<Button variant="link">@shadcn</Button>}
            />
            <HoverCardContent>
              <p className="text-sm">A preview card shown on hover.</p>
            </HoverCardContent>
          </HoverCard>
        </Section>

        <Section title="Dropdown Menu">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline">Open menu</Button>}
            />
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        <Section title="Dialog">
          <Dialog>
            <DialogTrigger
              render={<Button variant="outline">Open dialog</Button>}
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section title="Alert Dialog">
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive">Delete</Button>}
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Section title="Sheet">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline">Open sheet</Button>}
            />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet title</SheetTitle>
                <SheetDescription>
                  Sheet description goes here.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </Section>

        <Section title="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Current</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Section>

        <Section title="Pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Section title="Input OTP">
          <InputOTP maxLength={4}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </Section>

        <Section title="Alert">
          <Alert className="w-full">
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              This is a standard alert component.
            </AlertDescription>
          </Alert>
        </Section>

        <div className="flex flex-col gap-3 rounded-lg border p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Form Controls
          </h2>
          <div className="flex w-full max-w-sm flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Jane Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about yourself" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="notifs" />
              <Label htmlFor="notifs">Enable notifications</Label>
            </div>
            <RadioGroup defaultValue="a">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="a" />
                <Label htmlFor="a">Option A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="b" />
                <Label htmlFor="b">Option B</Label>
              </div>
            </RadioGroup>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
            <Slider defaultValue={[40]} max={100} step={1} />
            <Progress value={65} />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Card
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Main card content area.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Tabs
          </h2>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content for tab one.</TabsContent>
            <TabsContent value="tab2">Content for tab two.</TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Accordion
          </h2>
          <Accordion defaultValue={["item-1"]} className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes, it follows the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes, it comes with default styles.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Collapsible
          </h2>
          <Collapsible className="w-full">
            <CollapsibleTrigger
              render={<Button variant="outline">Toggle content</Button>}
            />
            <CollapsibleContent className="pt-2 text-sm">
              Hidden content revealed on toggle.
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-5">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Scroll Area
          </h2>
          <ScrollArea className="h-32 w-full rounded-md border p-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <p key={i} className="text-sm">
                Scrollable row {i + 1}
              </p>
            ))}
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Table
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Invoice #1</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Invoice #2</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell className="text-right">$150.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="font-mono text-xs text-muted-foreground">
        (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </div>
  )
}
