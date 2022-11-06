# Why is handling links difficult?

The thing with links in a Packages `README.md` that makes them difficult is two fold.

Firstly the frontend uses `markdown-it` to parse the MarkDown based ReadMe into usable HTML. This generally passed any links as-is into the HTML.

The thing is if the link is written as anything other than a fully qualified link, that is like `https://github.com/pulsar-edit/pulsar/LICENSE.md` then it will break, that's because it would give your web browser something like `./LICENSE.md` which your browser then searches for with `https://web.pulsar-edit.dev/packages/pulsar/LICENSE.md`, which of course this doesn't exist.

So we have to do two things:

1) Hook into the Markdown parsing, and modify any links that are created.
2) Modify them in such a way to properly point to the correct location.

Now this second part is a bit more tricky and has some variables.

Since there are multiple ways a relative link may be defined:

* `./` - Current Directory - Relative Link Operand
* `/` - Root Directory of the Repo
* `../` - Up One Directory within that Repos Folder - Relative Link Operand (Keep in mind this instance is never checked, since we are considering the README.md but is just documented here since it's supported on most major VCS')
* ` ` - You might be thinking why is this just an empty space? Well more on that below.

With these considerations, most are straight forward, some Regex to check for the link beginning with those values, and if found, take the rest of the slug and append it to the packages repository. Then we are good.

But the last one, which I'll call an Implicit Current Directory Relative Link Operand, implies it means the root since it lacks a proper protocol attached.
