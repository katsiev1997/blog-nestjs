# pen interactive cheat sheet

## Start / stop

| Goal | Command |
|------|---------|
| New file | `pen interactive --out designs/blog.pen` |
| Edit existing | `pen interactive --in designs/blog.pen --out designs/blog.pen` |
| Live Cursor extension | `pen interactive -a cursor -i designs/blog.pen` (extension must be open) |

## Bootstrap tools

```
read_skill()
read_skill({ path: "guide/design-system.md" })
read_skill({ path: "execute.md" })
read_skill({ path: "pen-schema.md" })
import_library({ path: "pencil:shadcn.lib.pen" })
list_libraries()
get_app_state()
```

## Discover & inspect

```
execute({ input: 'Get((n,c)=>{c.skipChildren();Print(n.id,n.name)})' })
execute({ input: 'Get(n=>n.reusable&&Print(n.id,n.name))' })
execute({ input: 'Print(Get("nodeId", {depth: 3}))' })
```

## Screen frame template

```
execute({ input: 'login=Insert(document,{type:"frame",name:"Login",x:0,y:0,width:1440,height:900,layout:"vertical",fill:"$--background",clip:true})' })
```

Place next screens with `FindEmptySpace` or fixed offsets (e.g. x += 1520).

## Instance + slot pattern

```
card=Insert(parent, {type:"ref", ref:"CardId", width:480})
# then Insert into card+"/slotId" or Replace slot content
# Override labels via descendants: { "labelId": { content: "Sign in" } }
```

Disable unused slots: `Update(path, { enabled: false })`.

## Verify & export

```
execute({ input: 'TakeScreenshot(["login"])' })
execute({ input: 'Export(["login","register"], "png", "./designs")' })
save()
exit()
```

## Libraries

```
import_library({ path: "pencil:shadcn.lib.pen" })
list_libraries()
remove_library({ id: "6" })   # id from list_libraries
```
