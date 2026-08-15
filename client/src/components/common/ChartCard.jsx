import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  isLoading,
  loadingHeight = 240,
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <CardDescription className="mt-0.5">{description}</CardDescription>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="skeleton w-full rounded-xl" style={{ height: loadingHeight }} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
