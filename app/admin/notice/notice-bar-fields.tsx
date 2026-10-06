import { Field, FieldLabel } from '~/components/ui/field.tsx'
import { Input } from '~/components/ui/input.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import { CharCount, FieldGrid, FieldMessage, FormSection, SelectField, SwitchField } from '../form-parts.tsx'
import type { BarFormState } from './notice-form.ts'

const directionOptions = [
  { label: '横向', value: 'horizontal' },
  { label: '纵向轮播', value: 'vertical' },
]

const themeOptions = [
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
]

const marqueeOptions = [
  { label: '关闭', value: 'false' },
  { label: '默认开启', value: 'true' },
  { label: '自定义参数', value: 'custom' },
]

const prefixIconOptions = [
  { label: '默认图标', value: 'default' },
  { label: '隐藏', value: 'hidden' },
  { label: '图标名称', value: 'name' },
  { label: 'JSON 对象', value: 'object' },
]

const suffixIconOptions = [
  { label: '不设置', value: 'none' },
  { label: '图标名称', value: 'name' },
  { label: 'JSON 对象', value: 'object' },
]

export function NoticeBarFields({
  form,
  errors,
  update,
}: {
  form: BarFormState
  errors: Record<string, string>
  update: (patch: Partial<BarFormState>) => void
}) {
  return (
    <>
      <FormSection title="公告内容">
        <Field invalid={Boolean(errors.barContent)}>
          <FieldLabel>内容</FieldLabel>
          <Textarea
            maxLength={1000}
            onChange={(event) => update({ content: event.target.value })}
            placeholder={form.direction === 'vertical' ? '每行一条轮播公告' : '请输入公告栏内容'}
            rows={form.direction === 'vertical' ? 6 : 4}
            value={form.content}
          />
          <CharCount max={1000} value={form.content} />
          <FieldMessage error={errors.barContent} />
        </Field>
      </FormSection>

      <FormSection title="显示方式">
        <FieldGrid>
          <SelectField
            label="滚动方向"
            onValueChange={(value) => update({ direction: value as BarFormState['direction'] })}
            options={directionOptions}
            value={form.direction}
          />
          <SelectField
            label="主题"
            onValueChange={(value) => update({ theme: value as BarFormState['theme'] })}
            options={themeOptions}
            value={form.theme}
          />
        </FieldGrid>
        <FieldGrid>
          <Field invalid={Boolean(errors.interval)}>
            <FieldLabel>轮播间隔</FieldLabel>
            <Input
              inputMode="numeric"
              onValueChange={(value) => update({ interval: value })}
              type="number"
              value={form.interval}
            />
            <FieldMessage error={errors.interval} />
          </Field>
          <Field invalid={Boolean(errors.operation)}>
            <FieldLabel>操作文字</FieldLabel>
            <Input maxLength={20} onValueChange={(value) => update({ operation: value })} value={form.operation} />
            <FieldMessage error={errors.operation} />
          </Field>
        </FieldGrid>
        <SelectField
          label="横向滚动"
          onValueChange={(value) => update({ marqueeMode: value as BarFormState['marqueeMode'] })}
          options={marqueeOptions}
          value={form.marqueeMode}
        />
        {form.marqueeMode === 'custom' && (
          <FieldGrid className="sm:grid-cols-3">
            <Field invalid={Boolean(errors.marqueeSpeed)}>
              <FieldLabel>滚动速度</FieldLabel>
              <Input
                inputMode="numeric"
                onValueChange={(value) => update({ marqueeSpeed: value })}
                type="number"
                value={form.marqueeSpeed}
              />
              <FieldMessage error={errors.marqueeSpeed} />
            </Field>
            <Field invalid={Boolean(errors.marqueeLoop)}>
              <FieldLabel>滚动次数</FieldLabel>
              <Input
                inputMode="numeric"
                onValueChange={(value) => update({ marqueeLoop: value })}
                type="number"
                value={form.marqueeLoop}
              />
              <FieldMessage error={errors.marqueeLoop} />
            </Field>
            <Field invalid={Boolean(errors.marqueeDelay)}>
              <FieldLabel>滚动延迟</FieldLabel>
              <Input
                inputMode="numeric"
                onValueChange={(value) => update({ marqueeDelay: value })}
                type="number"
                value={form.marqueeDelay}
              />
              <FieldMessage error={errors.marqueeDelay} />
            </Field>
          </FieldGrid>
        )}
      </FormSection>

      <FormSection title="图标与显隐">
        <FieldGrid>
          <SelectField
            label="前置图标"
            onValueChange={(value) => update({ prefixIconMode: value as BarFormState['prefixIconMode'] })}
            options={prefixIconOptions}
            value={form.prefixIconMode}
          />
          <SelectField
            label="后置图标"
            onValueChange={(value) => update({ suffixIconMode: value as BarFormState['suffixIconMode'] })}
            options={suffixIconOptions}
            value={form.suffixIconMode}
          />
        </FieldGrid>
        {form.prefixIconMode === 'name' && (
          <Field invalid={Boolean(errors.prefixIconName)}>
            <FieldLabel>前置图标名称</FieldLabel>
            <Input
              maxLength={50}
              onValueChange={(value) => update({ prefixIconName: value })}
              value={form.prefixIconName}
            />
            <FieldMessage error={errors.prefixIconName} />
          </Field>
        )}
        {form.prefixIconMode === 'object' && (
          <Field invalid={Boolean(errors.prefixIconJson)}>
            <FieldLabel>前置图标 JSON</FieldLabel>
            <Textarea
              className="font-mono"
              onChange={(event) => update({ prefixIconJson: event.target.value })}
              rows={4}
              value={form.prefixIconJson}
            />
            <FieldMessage error={errors.prefixIconJson} />
          </Field>
        )}
        {form.suffixIconMode === 'name' && (
          <Field invalid={Boolean(errors.suffixIconName)}>
            <FieldLabel>后置图标名称</FieldLabel>
            <Input
              maxLength={50}
              onValueChange={(value) => update({ suffixIconName: value })}
              value={form.suffixIconName}
            />
            <FieldMessage error={errors.suffixIconName} />
          </Field>
        )}
        {form.suffixIconMode === 'object' && (
          <Field invalid={Boolean(errors.suffixIconJson)}>
            <FieldLabel>后置图标 JSON</FieldLabel>
            <Textarea
              className="font-mono"
              onChange={(event) => update({ suffixIconJson: event.target.value })}
              rows={4}
              value={form.suffixIconJson}
            />
            <FieldMessage error={errors.suffixIconJson} />
          </Field>
        )}
        <SwitchField
          checked={form.visible}
          description="透传 NoticeBar visible 参数"
          label="当前显示"
          onCheckedChange={(checked) => update({ visible: checked })}
        />
        <SwitchField
          checked={form.defaultVisible}
          description="透传 NoticeBar defaultVisible 参数"
          label="默认显示"
          onCheckedChange={(checked) => update({ defaultVisible: checked })}
        />
      </FormSection>
    </>
  )
}
